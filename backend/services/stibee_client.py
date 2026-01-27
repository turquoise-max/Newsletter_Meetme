import os
import requests
from dotenv import load_dotenv

load_dotenv()

class StibeeClient:
    def __init__(self):
        self.api_key = os.getenv("STIBEE_API_KEY")
        self.list_id = os.getenv("STIBEE_LIST_ID")
        
        if not self.api_key:
            raise ValueError("STIBEE_API_KEY가 설정되지 않았습니다.")
        if not self.list_id:
            raise ValueError("STIBEE_LIST_ID가 설정되지 않았습니다.")
            
        self.base_url = "https://api.stibee.com/v1"
        self.headers = {
            "AccessToken": self.api_key,
            "Content-Type": "application/json"
        }

    def create_and_send_email(self, title: str, html_content: str):
        """
        이메일 초안을 생성합니다 (또는 스티비 API 사용 방식에 따라 발송).
        일반적으로 캠페인 초안을 먼저 생성합니다.
        """
        # 참고: 이메일 생성을 위한 스티비 API 구조는 다를 수 있습니다.
        # 일반적인 ESP 패턴을 기반으로 한 가상의 구현입니다.
        # 명세 기준: POST /v1/emails
        
        url = f"{self.base_url}/emails"
        
        payload = {
            "listId": int(self.list_id), # listId가 정수형이어야 하는 경우를 대비
            "title": title,
            "content": html_content,
            "sendType": "manual", # 또는 즉시 발송을 원할 경우 'immediate'. 여기서는 초안 생성으로 가정합니다.
            # 'sender', 'preview' 등 추가 파라미터가 필요할 수 있습니다.
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"스티비 발송 오류: {e}")
            if hasattr(e, 'response') and e.response is not None:
                 print(f"스티비 응답: {e.response.text}")
            return {"error": str(e)}
