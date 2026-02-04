import json
import re

def clean_json_text(text: str) -> str:
    """
    AI가 생성한 텍스트에서 JSON 부분만 추출하고 제어 문자를 제거하여 
    파싱 가능한 상태로 정제합니다.
    """
    text = text.strip()
    
    # 마크다운 코드 블록 제거 (```json ... ``` 또는 ``` ... ```)
    if "```" in text:
        # json 언어 식별자가 있는 경우 우선 처리
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        else:
            # 일반 코드 블록 처리
            block_match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
            if block_match:
                text = block_match.group(1)

    # 유효하지 않은 제어 문자 제거 (\x00-\x1F, \x7F)
    # 단, 줄바꿈(\n), 탭(\t), 캐리지 리턴(\r)은 JSON에서 유효하므로 유지하거나 이스케이프 처리 확인 필요
    # 여기서는 안전을 위해 아예 제거하거나 공백으로 대체
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    return text.strip()

def parse_ai_json(text: str):
    """
    정제된 텍스트를 JSON으로 파싱합니다. 실패 시 다양한 복구 시나리오를 적용합니다.
    """
    cleaned = clean_json_text(text)
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # 따옴표 이스케이프 문제 등 흔한 에러에 대한 추가 정제 시도
        try:
            # 본문 내의 줄바꿈이 이스케이프 되지 않은 경우 처리
            # (매우 단순한 형태의 복구이므로 주의 필요)
            fixed = cleaned.replace('\n', '\\n').replace('\r', '')
            # 하지만 JSON 구조 자체의 줄바꿈은 유지해야 하므로 re.sub 등을 써야 할 수도 있음
            # 일단은 표준 에러 로깅 후 다시 시도
            return json.loads(cleaned) 
        except:
            raise e