import os
from google import genai
from google.genai import types
import json
import traceback
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

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
        """
        사용자 주제를 3가지 다른 관점의 심화 검색어로 확장합니다.
        """
        if not self.gemini_client:
            return [topic]
            
        prompt = f"""
        당신은 전문 리서치 전략가입니다. 
        사용자의 주제 '{topic}'에 대해 더 깊이 있고 다각적인 정보를 수집하기 위해 3개의 검색어를 생성하십시오.
        
        검색어는 다음 세 가지 관점을 포함해야 합니다:
        1. 기술적 최신 트렌드 및 변화
        2. 시장 영향력 및 비즈니스 인사이트
        3. 실제 적용 사례 및 구체적인 데이터/통계
        
        결과는 반드시 JSON 리스트 형식으로만 출력하십시오. 
        예시: ["검색어1", "검색어2", "검색어3"]
        """
        try:
            response = self.gemini_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type='application/json')
            )
            expanded = json.loads(response.text)
            return expanded if isinstance(expanded, list) else [topic]
        except:
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

        # 아티클 리스트를 문자열로 변환 (URL 보존 강조)
        articles_context = ""
        if articles:
            for i, a in enumerate(articles):
                articles_context += f"--- Source {i+1} ---\nTitle: {a.get('title')}\nURL: {a.get('url')}\nContent: {a.get('content')}\n\n"

        prompt = f"""
        당신은 감성적이고 통찰력 있는 뉴스레터 **'밑미(meet me)' 스타일의 수석 에디터**입니다. 
        당신의 목표는 '{topic}'에 관해 독자에게 깊은 울림을 주는 뉴스레터를 발행하는 것입니다.

        {tone_instruction}
        주요 언어: 한국어 (Korean/Hangul).
        오늘의 날짜: {today_date}

        [필수 작성 규칙]
        1. **1:1 아티클 매칭:** 아래 [Sources]에 제공된 각 아티클을 순서대로 하나의 블록(`main_story` 또는 `deep_dive`)으로 변환하십시오.
        2. **링크 무결성:** 각 블록의 `link` 필드에는 반드시 해당 Source의 **실제 URL**만 넣으십시오. 절대 가공하지 마십시오.
        3. **연결성(Bridges):** 블록과 블록 사이에는 "앞서 언급한 변화는 우리에게 이런 질문을 던집니다", "이러한 흐름 속에서 주목해야 할 또 다른 지점은..."과 같은 부드러운 연결 문구를 본문(`body`) 시작점에 포함하십시오.
        4. **전체 테마:** {refined_context}에서 분석된 핵심 인사이트를 뉴스레터 전체의 흐름으로 유지하십시오.

        [Sources]
        {articles_context}

        [Available Images]
        {refined_context} (내부의 이미지 URL 리스트 활용)
        
        [Output Format]
        반드시 추가 텍스트 없이 유효한 JSON 객체만 출력하십시오. 
        뉴스레터는 '블록(Block)' 단위로 구성됩니다. 
        **최소 10개 이상의 블록**을 포함하여 깊이 있는 뉴스레터를 만드십시오.

        사용 가능한 블록 타입 및 스키마:
        
        1. header (헤더): 뉴스레터 시작
        {{
            "type": "header",
            "content": {{
                "title": "뉴스레터 메인 타이틀 (매력적으로)",
                "date": "2026년 1월 27일",
                "intro": "독자에게 건네는 매력적인 인사말 (2-3문장)"
            }}
        }}

        2. main_story (메인 기사): 가장 중요한 뉴스. 이미지 필수.
        {{
            "type": "main_story",
            "content": {{
                "title": "강력한 헤드라인",
                "image_url": "Context에서 찾은 관련 이미지 URL (없으면 null)",
                "image_prompt": "기사 내용을 잘 나타내는 고품질 이미지 프롬프트 (image_url이 없을 때 사용)",
                "body": "상세한 본문 내용 (4-5단락 이상). 마크다운을 사용하여 가독성을 높이십시오.",
                "link": "원문 링크",
                "link_text": "전체 기사 읽기"
            }}
        }}

        3. deep_dive (심층 분석): 특정 주제에 대한 깊이 있는 분석.
        {{
            "type": "deep_dive",
            "content": {{
                "title": "심층 분석: [주제]",
                "body": "전문적인 시각에서의 분석 내용 (긴 호흡의 글). 인사이트를 포함하십시오."
            }}
        }}

        4. quick_hits (단신 모음): 짧은 뉴스 리스트. (여러 번 사용 가능)
        {{
            "type": "quick_hits",
            "content": {{
                "title": "놓치면 안 될 뉴스 / 업계 단신",
                "items": [
                    {{ "text": "뉴스 1 핵심 요약", "link": "URL" }},
                    {{ "text": "뉴스 2 핵심 요약", "link": "URL" }},
                    {{ "text": "뉴스 3 핵심 요약", "link": "URL" }}
                ]
            }}
        }}

        5. tool_spotlight (도구 추천): 관련 소프트웨어나 도구 소개.
        {{
            "type": "tool_spotlight",
            "content": {{
                "name": "도구 이름",
                "description": "이 도구가 유용한 이유와 주요 기능 설명",
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
                # Gemini 호출 (New SDK)
                response = self.gemini_client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json'
                    )
                )
                
                # JSON 파싱
                try:
                    # New SDK response structure
                    result = json.loads(response.text)
                    return result
                except json.JSONDecodeError:
                    clean_text = response.text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text.replace("```json", "", 1)
                    if clean_text.startswith("```"):
                        clean_text = clean_text.replace("```", "", 1)
                    if clean_text.endswith("```"):
                        clean_text = clean_text.rsplit("```", 1)[0]
                    
                    return json.loads(clean_text.strip())
                
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
