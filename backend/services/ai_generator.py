import os
from google import genai
from google.genai import types
import json
import traceback
import re
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from utils.json_parser import parse_ai_json

load_dotenv()

class AIGeneratorService:
    def __init__(self):
        # Gemini Init (New SDK: google-genai)
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        if self.gemini_api_key:
            self.gemini_client = genai.Client(api_key=self.gemini_api_key)
        else:
            self.gemini_client = None
        
        # OpenAI Init
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None

    def _analyze_context(self, topic: str, raw_context: str) -> str:
        """
        Tavily 검색 결과들 사이의 공통점과 연관성을 분석하여 정제된 문맥을 생성합니다.
        """
        if not self.gemini_client:
            return raw_context

        analysis_prompt = f"""
        당신은 정보 분석 전문가입니다. 주제: '{topic}'
        아래 제공된 여러 아티클 정보(Raw Context)를 분석하여:
        1. 모든 소스를 관통하는 가장 핵심적인 공통 주제를 찾으십시오.
        2. 서로 연관성이 높은 정보들 위주로 요약하고, 주제와 무관하거나 상충되는 정보는 제외하십시오.
        3. 뉴스레터 작성을 위한 '정제된 지식 베이스'를 텍스트 형태로 출력하십시오.

        [Raw Context]
        {raw_context}
        """
        try:
            # 빠른 분석을 위해 기본적으로 Gemini 사용 (New SDK)
            response = self.gemini_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=analysis_prompt
            )
            return response.text
        except:
            return raw_context # 분석 실패 시 원본 사용

    def generate_newsletter(self, topic: str, raw_context: str, tone: str = "professional", model_type: str = "gemini", articles: list = None):
        """
        수집된 개별 아티클들을 바탕으로 1:1 매칭되는 블록 뉴스레터를 생성합니다.
        """
        if model_type == "gpt" and not self.openai_client:
             return {
                "title": "오류 발생",
                "blocks": [{"type": "text", "content": {"text": "OPENAI_API_KEY가 설정되지 않았습니다."}}],
                "sources": [], "images": []
            }

        # 생성일 (오늘 날짜)
        today_date = datetime.now().strftime("%Y년 %m월 %d일")

        # 1. 문맥 정제 (Context Refinement)
        refined_context = self._analyze_context(topic, raw_context)

        tone_instruction = ""
        if tone == "friendly":
            tone_instruction = "Tone: Friendly, approachable, and warm. Use polite informal Korean (친근한 해요체 사용)."
        elif tone == "witty":
            tone_instruction = "Tone: Witty, humorous, and energetic. Use engaging and fun Korean (재치있고 활기찬 한국어 사용)."
        else: # professional
            tone_instruction = "Tone: Professional, authoritative, and concise. Use formal polite Korean (문맥에 따라 하십시오체 또는 정중한 해요체 사용)."

        # 아티클 리스트를 문자열로 변환 (URL 및 이미지 보존 강조)
        articles_context = ""
        if articles:
            for i, a in enumerate(articles):
                articles_context += f"--- Source {i+1} ---\nTitle: {a.get('title')}\nURL: {a.get('url')}\nAssociated Images: {a.get('associated_images', [])}\nContent: {a.get('content')}\n\n"

        prompt = f"""
        당신은 감성적이고 통찰력 있는 뉴스레터 전문 수석 에디터입니다. 
        당신의 목표는 '{topic}'에 관해 독자에게 깊은 정보와 울림을 주는 마키나락스형 매거진 스타일의 뉴스레터를 발행하는 것입니다.

        [스타일 가이드]
        1. **톤앤매너**: 격식 있는 대화체(~해요, ~입니다). 전문 용어는 반드시 문맥으로 풀어서 설명하세요.
        2. **오프닝 필수 문구**: 상단 인사는 반드시 "안녕하세요, 오픈해 주셔서 감사합니다"로 시작하세요.
        3. **시각적 구조**: 문단 사이 충분한 여백, 핵심 키워드는 `<strong>` 태그로 **굵게** 강조하세요. (마크다운 `**` 금지)
        4. **가독성 규칙**: 
           - 한 문단은 **최대 3줄**을 넘지 않아야 합니다.
           - 불렛 포인트(•)와 내용에 어울리는 이모지(🚀, 💡, 📊 등)를 적극 활용하세요.

        [뉴스레터 구성 순서]
        1. **오프닝 (header)**: "안녕하세요, 오픈해 주셔서 감사합니다"로 시작. 독자의 고민이나 질문(Hook)으로 시작해 주제의 가치를 2~3문장으로 설명하세요.
        2. **오늘의 퀵 서머리 (quick_summary)**: 이번 호의 핵심 요약 3문장을 배치하세요.
        3. **챕터 구성 (chapter_header -> main_story -> deep_dive -> tool_spotlight)**:
           - 뉴스레터를 **최소 2개에서 최대 4개**의 명확한 챕터로 나누세요.
           - **중요**: 각 챕터에는 반드시 **딱 1개의 main_story** 블록만 배치해야 합니다.
           - `main_story`: 배경 -> 해결 -> 이득 구조로 300자 내외 압축 서술.
        4. **단신 리스트 (short_news)**: 관련 뉴스 3~5개를 이모지와 함께 구성하세요. 각 뉴스 제목은 기사 내용을 분석한 날카로운 **한 줄 요약**이어야 합니다.
        5. **클로징 (insight)**: 단순히 마무리가 아닌, 전체 뉴스레터 내용을 종합하여 독자가 얻을 수 있는 **전략적 통찰과 핵심 시사점**을 깊이 있게 담으세요.

        [필수 작성 규칙]
        1. **Benefit-Driven**: '그래서 독자에게 무엇이 좋은가?'에 집중하세요.
        2. **이미지 안내**: `main_story`의 이미지 캡션 필드에 "이미지를 클릭하면 전문으로 연결됩니다"를 포함하세요.

        주요 언어: 한국어 (Korean/Hangul).
        오늘의 날짜: {today_date}

        [Sources]
        {articles_context}

        [Available Images]
        {refined_context} (내부의 이미지 URL 리스트 활용)
        
        [Output Format]
        반드시 추가 텍스트 없이 유효한 JSON 객체만 출력하십시오. 
        뉴스레터는 '블록(Block)' 단위로 구성됩니다. 
        **최소 10개 이상의 블록**을 포함하여 깊이 있는 뉴스레터를 만드십시오.

        사용 가능한 블록 타입 및 상세 가이드:
        
        1. header
        {{
            "type": "header",
            "content": {{
                "title": "메인 타이틀",
                "date": "{today_date}",
                "intro": "안녕하세요, 오픈해 주셔서 감사합니다. (독자 공감 Hook 포함)"
            }}
        }}

        2. quick_summary
        {{
            "type": "quick_summary",
            "content": {{
                "items": ["요약문 1", "요약문 2", "요약문 3"]
            }}
        }}

        3. chapter_header
        {{
            "type": "chapter_header",
            "content": {{ "title": "챕터 주제" }}
        }}

        4. main_story
        {{
            "type": "main_story",
            "content": {{
                "title": "헤드라인",
                "image_url": "URL",
                "body": "300자 내외 [배경-해결-이득] 구조",
                "link": "URL",
                "image_caption": "이미지를 클릭하면 전문으로 연결됩니다"
            }}
        }}

        5. deep_dive
        {{
            "type": "deep_dive",
            "content": {{
                "title": "분석 제목",
                "body": "400자 내외 리스트 중심 분석"
            }}
        }}

        6. tool_spotlight
        {{
            "type": "tool_spotlight",
            "content": {{
                "name": "도구명",
                "description": "기능 및 유용성 설명",
                "link": "URL"
            }}
        }}

        7. short_news
        {{
            "type": "short_news",
            "content": {{
                "title": "News Briefs",
                "news_items": [
                    {{ "emoji": "🚀", "text": "제목", "link": "URL" }}
                ]
            }}
        }}

        8. insight (Closing)
        {{
            "type": "insight",
            "content": {{
                "text": "오늘의 레터 어떠셨나요? (피드백 및 구독 안내 포함)"
            }}
        }}

        전체 JSON 구조:
        {{
            "title": "뉴스레터 관리용 제목",
            "blocks": [ ... 위 블록들을 조합하여 구성 (순서 자유롭게) ... ]
        }}
        """

        try:
            if model_type == 'gpt':
                # OpenAI GPT 호출
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o", # 또는 gpt-4-turbo
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            
            else:
                # Gemini 호출 (Gemini 2.5 Flash 적용)
                response = self.gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json'
                    )
                )
                
                # 중앙 집중화된 JSON 파싱 유틸리티 사용
                return parse_ai_json(response.text)
                
        except Exception as e:
            print("=== AIGeneratorService 오류 발생 ===")
            print(f"Error Message: {e}")
            traceback.print_exc() # 상세 스택 트레이스 출력
            return {
                "title": f"{topic} 뉴스레터 (생성 실패)",
                "blocks": [
                    {
                        "type": "text",
                        "content": {
                            "text": f"뉴스레터 생성 중 오류가 발생했습니다.\n\nError: {str(e)}"
                        }
                    }
                ],
                "sources": [],
                "images": []
            }