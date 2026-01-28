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
            
        # 최신 문서에 따라 베이스 URL을 v2로 변경합니다.
        self.base_url = "https://api.stibee.com/v2"
        self.headers = {
            "AccessToken": self.api_key,
            "Content-Type": "application/json"
        }

    def create_and_send_email(self, title: str, html_content: str):
        """
        스티비 API v2를 통해 이메일을 생성하고 즉시 발송합니다.
        1. 이메일 생성 (POST /v2/emails)
        2. 이메일 발송 (POST /v2/emails/{id}/send)
        """
        create_url = f"{self.base_url}/emails"
        
        # 1단계: 이메일 생성 payload
        create_payload = {
            "listId": int(self.list_id),
            "senderEmail": os.getenv("STIBEE_SENDER_EMAIL"),
            "senderName": os.getenv("STIBEE_SENDER_NAME"),
            "subject": title,
            "contents": html_content
        }
        
        try:
            # 1. 이메일 생성 요청
            print(f"STIBEE [Step 1] Creating Email... Subject: {title}")
            create_res = requests.post(create_url, headers=self.headers, json=create_payload)
            print(f"STIBEE Create Status: {create_res.status_code}")
            
            if create_res.status_code not in [200, 201]:
                print(f"STIBEE Create Error: {create_res.text}")
                create_res.raise_for_status()
            
            email_data = create_res.json()
            # API 응답 구조에 따라 ID 필드 확인 필요 (보통 'id' 또는 'data': {'id': ...})
            email_id = email_data.get('id') or email_data.get('data', {}).get('id')
            
            if not email_id:
                return {"status": "error", "message": "이메일 ID를 가져오지 못했습니다.", "raw": email_data}

            # 2. 이메일 발송 요청
            print(f"STIBEE [Step 2] Sending Email (ID: {email_id})...")
            send_url = f"{self.base_url}/emails/{email_id}/send"
            send_res = requests.post(send_url, headers=self.headers)
            print(f"STIBEE Send Status: {send_res.status_code}")
            
            if send_res.status_code not in [200, 201]:
                print(f"STIBEE Send Error: {send_res.text}")
                send_res.raise_for_status()
                
            return {
                "status": "success", 
                "message": "이메일이 생성되고 발송되었습니다.",
                "email_id": email_id,
                "detail": send_res.json() if send_res.text else {}
            }

        except requests.exceptions.RequestException as e:
            error_msg = f"스티비 API 오류: {e}"
            if hasattr(e, 'response') and e.response is not None:
                 error_msg += f" | 상세: {e.response.text}"
            print(error_msg)
            return {"status": "error", "message": error_msg}
