# AI Newsletter SaaS 프로젝트 기술 명세 및 혁신 리포트

## 1. 프로젝트 개요
본 솔루션은 사용자의 주제 입력만으로 **'리서치 → 고품질 이미지 수집 → AI 뉴스레터 작성 → 스티비(Stibee) 발행'**의 전 과정을 자동화하는 지능형 SaaS 플랫폼입니다. 단순히 정보를 나열하는 기능을 넘어, 매체별 신뢰할 수 있는 소스 기반의 뉴스레터를 지향합니다.

---

## 2. 개발 단계별 핵심 기능 및 기술적 성취

### A. 지능형 리서치 및 검색 (Smart Search)
*   **멀티 관점 쿼리 확장**: 주제 입력 시 Gemini 2.5 Flash를 활용해 기술적 트렌드, 시장 영향, 실제 사례 등 3가지 심화 키워드로 확장하여 검색의 깊이를 극대화합니다.
*   **완전 병렬 검색 시스템**: `asyncio.gather`를 통해 확장된 모든 쿼리에 대한 검색 및 스크래핑을 동시에 진행하여 생성 속도를 기존 대비 3배 이상 단축했습니다.

### B. Playwright 기반 동적 수집 (High-Fidelity Collection)
*   **동적 렌더링 극복**: 정적 파싱의 한계를 넘어 **Playwright(Headless Browser)**를 도입, 자바스크립트로 렌더링되는 기사 본문과 이미지를 100% 포착합니다.
*   **지능형 이미지 필터링**: 
    *   **Semantic Check**: URL 내 키워드(avatar, profile, icon 등) 분석으로 프로필 사진 및 이모지 차단.
    *   **Fidelity Check**: 이미지 헤더 조회를 통한 파일 용량(5KB 미만 차단) 및 해상도 기반 고품질 이미지 선별.
    *   **Quantity Control**: 각 아티클당 최상위 3개의 핵심 이미지만 엄선하여 데이터 효율 최적화.
*   **리소스 최적화**: PDF 다운로드 링크나 무거운 미디어 요청을 사전에 차단하여 크롤링 안정성을 확보했습니다.

### C. AI 수석 편집장 엔진 (Advanced Generation)
*   **Gemini 2.5 Flash 최적화**: 최신 고성능 모델을 적용하여 방대한 검색 컨텍스트를 실시간으로 분석하고 '밑미(meet me)' 스타일의 통찰력 있는 문체를 생성합니다.
*   **1:1 소스-이미지 바인딩**: 각 뉴스 블록이 근거 기사에서 추출된 이미지와 1:1로 매칭되도록 보장하여 정보의 시각적 신뢰도를 확보했습니다.
*   **후처리 인젝션(Post-Processing Injection)**: 할루시네이션(환각 현상)을 원천 차단하기 위해 백엔드 엔진에서 실제 수집된 URL과 이미지를 생성된 블록에 강제로 주입합니다.

### D. 프리미엄 에디터 및 발행 (UX & Delivery)
*   **소스별 이미지 라이브러리**: 수집된 이미지를 출처(Article)별로 묶어서 보여주는 직관적인 사이드바 UI를 통해 사용자가 맥락에 맞는 이미지를 쉽게 교체할 수 있습니다.
*   **Stibee API v2 자동화**: 이메일 초안 생성부터 실제 주소록 발송까지의 2단계 프로세스를 버튼 하나로 자동화했습니다.
*   **디자인 충실도**: Tailwind CSS v4 기반의 모던한 디자인이 이메일 클라이언트에서도 완벽히 유지되도록 인라인 스타일 이식 시스템을 구축했습니다.

---

## 3. 적용된 혁신 아이디어 (Genius Insights)

### 💡 정보의 혈통(Link of Trust)
"URL은 에디터의 명예다." AI가 임의의 링크를 만들지 못하도록 **Link Injection** 기술을 적용하여 모든 정보의 출처를 명확히 했습니다.

### 💡 시각적 맥락의 일관성 (Visual Anchoring)
기존의 무작위 이미지 검색 방식에서 탈피하여, **"기사 안에 있는 이미지만 사용한다"**는 원칙을 고수함으로써 독자가 링크를 클릭했을 때 느끼는 시각적 괴리감을 없앴습니다.

### 💡 하이브리드 파이프라인 (Parallel Pipeline)
Tavily의 광범위한 검색과 Playwright의 정밀한 스크래핑을 병렬로 결합하여 **'넓은 정보력'**과 **'깊은 정확성'**을 동시에 달성했습니다.

---

## 4. 기술 스택 (Tech Stack)
*   **Frontend:** Next.js 14, React 18, Tailwind CSS v4, Tiptap, Lucide React
*   **Backend:** Python FastAPI, Playwright, BeautifulSoup4
*   **AI Engine:** Google Gemini 2.5 Flash (Main), OpenAI GPT-4o (Option)
*   **API Service:** Tavily Search, Stibee v2 Email Service

---
*본 보고서는 2026년 1월 28일 기준 프로젝트의 기술적 성취를 종합 기록한 문서입니다.*