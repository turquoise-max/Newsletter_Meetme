# AI Newsletter SaaS

AI를 활용하여 주제 입력만으로 고품질의 뉴스레터를 자동으로 생성하고 편집할 수 있는 SaaS 솔루션입니다.

## 🚀 주요 기능

- **AI 뉴스레터 자동 생성:** 사용자가 입력한 주제를 심층 분석하여 10개 이상의 블록으로 구성된 뉴스레터 초안을 작성합니다.
- **최신 자료 수집 (Smart Search):** Gemini 2.5 Flash를 활용한 3중 쿼리 확장 및 `asyncio.gather` 병렬 수집 파이프라인을 통해 검색의 깊이와 속도를 모두 확보했습니다.
- **동적 이미지 추출 (Playwright):** Playwright(Headless Browser)로 기사 원문에 직접 접속하여 실제 본문에 사용된 고품질 이미지를 정밀 추출합니다.
- **수집량 조절 슬라이더:** 사용자가 필요에 따라 검색어당 수집할 아티클 개수(1~10개)를 직접 제어할 수 있습니다.
- **블록형 에디터:** 생성된 초안을 Tiptap 기반 에디터에서 수정하고, 소스별 이미지 라이브러리를 통해 이미지를 쉽게 교체할 수 있습니다.

## 💡아이디어 및 기술적 성취

- **정보의 혈통(Link of Trust):** AI의 할루시네이션을 원천 차단하기 위해 수집된 원본 URL과 이미지를 생성 블록에 강제로 주입하는 **Injection 엔진**을 적용했습니다.
- **시간적 앵커링 (Temporal Anchoring):** AI의 학습 데이터 시점 한계를 극복하기 위해 시스템 날짜를 동적으로 주입하고, 아티클의 실제 발행일을 분석하여 **"어제 발표된...", "지난주 리포트에 따르면..."**과 같은 생생한 시점 기반 서술을 구현했습니다.
- **편집장-기자 듀얼 시스템 (Agentic Workflow):** `Crawler`는 정밀한 데이터 확보에, `Generator`는 수석 편집장 페르소나로서 전체적인 스토리텔링과 블록 간 연결(Bridge)에 집중하는 역할 분리 구조를 채택했습니다.
- **디자인 일치성 (Visual Fidelity):** 에디터의 모던한 UI(Tailwind v4 & Radix) 디자인을 HTML 내보내기 로직에 100% 인라인 CSS로 이식하여, 이메일 수신함에서도 동일한 시각적 감동을 전달합니다.

## ⚠️ 현재 상태 및 미구현 기능

- **엔진 고도화:** Playwright 동적 수집 및 병렬 검색 엔진 최적화 완료 (Gemini 2.5 Flash 기반)
- **보관함(Drafts) 기능:** 현재 미구현 (Supabase DB 연동 필요, 추후 업데이트 예정)

## 🛠 설치 및 실행 방법

### 사전 요구 사항
- Node.js (v18+)
- Python (3.9+)

### 백엔드 (FastAPI) 설정
1. `ai-newsletter-saas/backend` 폴더로 이동
2. 의존성 설치: `python3 -m pip install -r requirements.txt`
3. `.env` 파일 설정:
   ```env
   GEMINI_API_KEY=your_key
   OPENAI_API_KEY=your_key
   TAVILY_API_KEY=your_key
   ```
4. 서버 실행: `python3 main.py`

### 프론트엔드 (Next.js) 설정
1. `ai-newsletter-saas/frontend` 폴더로 이동
2. 의존성 설치: `npm install`
3. `.env.local` 파일 설정:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```
4. 실행: `npm run dev`

---
© 2026 AI Newsletter SaaS. All rights reserved.