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

    def expand_topic(self, topic: str) -> list[str]:
        """사용자 주제를 3가지 다른 관점의 심화 검색어로 확장합니다."""
        if not self.gemini_client:
            return [topic]
            
        prompt = f"사용자의 주제 '{topic}'에 대해 리서치 키워드 3개를 JSON 리스트로 생성하세요. 관점: 기술 트렌드, 시장 영향, 적용 사례."
        try:
            # Gemini 2.5 Flash 적용
            response = self.gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type='application/json')
            )
            expanded = json.loads(response.text)
            return expanded if isinstance(expanded, list) else [topic]
        except Exception as e:
            print(f"Topic expansion error: {e}")
            return [topic]

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
        당신은 감성적이고 통찰력 있는 뉴스레터 **'밑미(meet me)' 스타일의 수석 에디터**입니다. 
        당신의 목표는 '{topic}'에 관해 독자에게 깊은 정보와 울림을 주는 풍성한 뉴스레터를 발행하는 것입니다.

        {tone_instruction}
        주요 언어: 한국어 (Korean/Hangul).
        오늘의 날짜: {today_date}

        [필수 작성 규칙]
        1. **챕터 기반 스토리텔링:** 
           - 뉴스레터를 3개의 명확한 챕터로 나누십시오.
           - 각 챕터는 `[bridge (챕터 제목) -> main_story -> deep_dive -> tool_spotlight]` 순서의 논리적 흐름을 가져야 합니다.
           - 단순히 아티클을 나열하지 말고, 하나의 주제가 심화되는 과정을 보여주십시오.
        2. **극도로 압축된 스토리텔링 (Skimmable):** 
           - 독자가 3초 안에 핵심을 파악할 수 있도록 작성하십시오.
           - `main_story`는 약 300자 내외로, 서술보다는 핵심 요약문 위주로 작성하십시오. (1~2문장 뒤에 불렛 포인트 나열)
           - `deep_dive`는 약 400자 내외로 줄이되, 문장보다는 **불렛 포인트(리스트)**를 적극 활용하십시오 (텍스트의 70% 이상).
           - **이미지를 절대 포함하지 마십시오.** 오직 텍스트 분석에만 집중하십시오.
        5. **1:1 아티클 매칭:** 제공된 각 아티클 원천을 하나의 블록과 정확히 매칭하십시오.
        6. **텍스트 포맷팅:** 강조는 오직 HTML 태그 `<strong>`만 사용하십시오. 마크다운 `**`은 금지입니다.

        [Sources]
        {articles_context}

        [Available Images]
        {refined_context} (내부의 이미지 URL 리스트 활용)
        
        [Output Format]
        반드시 추가 텍스트 없이 유효한 JSON 객체만 출력하십시오. 
        뉴스레터는 '블록(Block)' 단위로 구성됩니다. 
        **최소 10개 이상의 블록**을 포함하여 깊이 있는 뉴스레터를 만드십시오.

        사용 가능한 블록 타입 및 상세 분량 가이드:
        
        1. header (헤더)
        {{
            "type": "header",
            "content": {{
                "title": "뉴스레터 메인 타이틀 (매력적으로)",
                "date": "{today_date}",
                "intro": "독자의 관심을 끌 수 있는 따뜻하고 전문적인 오프닝 인사 (4-5문장 이상)"
            }}
        }}

        2. chapter_header (챕터 구분): **명확한 챕터 시작을 알리는 블록**
        {{
            "type": "chapter_header",
            "content": {{
                "title": "챕터의 핵심 주제 (짧고 강렬하게)"
            }}
        }}

        3. bridge (브릿지): **블록 사이의 흐름을 잇는 독립 블록**
        {{
            "type": "bridge",
            "content": {{
                "text": "이전 블록과 다음 블록의 맥락을 부드럽게 이어주는 1~2문장의 감성적인 연결 문구"
            }}
        }}

        3. main_story (메인 기사): **압축적이고 임팩트 있는 서술 (이미지 포함, 최소 3개 필수)**
        {{
            "type": "main_story",
            "content": {{
                "title": "강력하고 매력적인 헤드라인",
                "image_url": "URL",
                "image_prompt": "프롬프트",
                "body": "300자 내외의 압축된 요약. 1~2개 문장 뒤에 불렛 포인트로 핵심 내용을 나열하십시오.",
                "link": "URL",
                "link_text": "원문에서 더 자세히 읽어보기"
            }}
        }}

        4. deep_dive (심층 분석): **텍스트 중심의 밀도 높은 인사이트 분석**
        {{
            "type": "deep_dive",
            "content": {{
                "title": "인사이트: [주제]",
                "body": "400자 내외의 리스트 중심 분석. 서술형 문장은 최소화하고 <strong>핵심 내용</strong>을 불렛 포인트로 요약하여 전달하십시오."
            }}
        }}

        5. tool_spotlight (도구 추천): 관련 소프트웨어나 도구 소개.
        {{
            "type": "tool_spotlight",
            "content": {{
                "name": "도구 이름",
                "description": "이 도구가 유용한 이유와 주요 기능 설명 (3-4문장으로 상세히)",
                "link": "URL"
            }}
        }}

        6. quote (인용구): 관련 인물의 발언이나 명언.
        {{
            "type": "quote",
            "content": {{
                "text": "인용 문구",
                "author": "발언자 이름/직함"
            }}
        }}

        7. stat_box (통계 박스): 주요 숫자나 통계 강조.
        {{
            "type": "stat_box",
            "content": {{
                "value": "85%",
                "label": "AI 도입률 증가",
                "description": "전년 대비 기업들의 AI 도입률 수치"
            }}
        }}

        8. insight (마무리 인사이트): 에디터의 한마디.
        {{
            "type": "insight",
            "content": {{
                "text": "뉴스레터를 마무리하며 독자에게 남기는 생각거리나 질문."
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