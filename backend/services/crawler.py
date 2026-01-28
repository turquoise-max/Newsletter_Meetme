import os
import requests
import asyncio
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

class CrawlerService:
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        if not self.api_key:
            raise ValueError("TAVILY_API_KEY가 설정되지 않았습니다.")
        self.client = TavilyClient(api_key=self.api_key)

    def _is_url_valid(self, url: str, check_image: bool = False) -> bool:
        """
        URL이 유효하고 접근 가능한지 확인합니다.
        check_image가 True이면 이미지의 퀄리티(크기, 키워드)도 함께 체크합니다.
        """
        if not url or not url.startswith('http'):
            return False
        
        # 1. 의미 없는 이미지 필터링 (키워드 기반)
        if check_image:
            blacklisted_keywords = [
                'avatar', 'profile', 'author', 'user', 'icon', 'emoji', 'logo', 
                'placeholder', 'pixel', 'banner-ad', 'loading', 'gravatar'
            ]
            if any(kw in url.lower() for kw in blacklisted_keywords):
                return False

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }

        try:
            # 2. 유효성 및 크기 확인 (HEAD 요청)
            response = requests.head(url, headers=headers, timeout=3.0, allow_redirects=True)
            if response.status_code == 200:
                if check_image:
                    # Content-Length가 너무 작으면 (예: 5KB 미만) 아이콘일 확률이 높음
                    content_length = int(response.headers.get('Content-Length', 0))
                    if 0 < content_length < 5000:
                        return False
                return True
        except:
            pass

        try:
            # 3. GET 요청 (HEAD 차단된 경우)
            response = requests.get(url, headers=headers, timeout=3.0, stream=True, allow_redirects=True)
            return response.status_code == 200
        except:
            return False

    def _filter_valid_urls(self, urls: list, check_image: bool = False) -> list:
        """
        병렬로 URL 유효성을 검사하여 유효한 것만 반환합니다.
        """
        with ThreadPoolExecutor(max_workers=10) as executor:
            # functools.partial 대신 lambda를 사용하여 check_image 인자 전달
            results = list(executor.map(lambda u: self._is_url_valid(u, check_image), urls))
        return [url for url, is_valid in zip(urls, results) if is_valid]

    async def _scrape_images_with_playwright(self, url: str) -> list:
        """
        Playwright 무두 브라우저를 사용하여 동적 렌더링된 이미지를 추출합니다.
        """
        from playwright.async_api import async_playwright
        
        # PDF 또는 직접 다운로드 링크는 제외
        if url.lower().endswith('.pdf') or '/download/' in url.lower():
            print(f"Skipping Playwright for non-HTML URL: {url}")
            return []

        extracted = []
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )
                page = await context.new_page()
                
                # 타임아웃 설정 및 에러 핸들링 강화
                try:
                    # networkidle 대신 domcontentloaded로 기본 대기 후 짧은 추가 대기
                    await page.goto(url, wait_until="domcontentloaded", timeout=10000)
                    await asyncio.sleep(2) # 동적 콘텐츠 렌더링 시간 확보
                except Exception as e:
                    print(f"Playwright navigation timeout/error for {url}, attempting partial extraction...")

                # 1. 메타 데이터 추출 (og:image, twitter:image)
                meta_images = await page.evaluate('''() => {
                    const results = [];
                    const og = document.querySelector('meta[property="og:image"]');
                    if (og) results.push(og.content);
                    const twitter = document.querySelector('meta[name="twitter:image"]');
                    if (twitter) results.push(twitter.content);
                    return results;
                }''')
                extracted.extend(meta_images)
                
                # 2. 본문 내 모든 img 태그 추출
                img_srcs = await page.evaluate('''() => {
                    return Array.from(document.querySelectorAll('img'))
                        .map(img => img.src)
                        .filter(src => src.startsWith('http'));
                }''')
                extracted.extend(img_srcs)
                
                await browser.close()
                
            # 유효한 확장자만 필터링 및 중복 제거
            valid_extracted = [u for u in extracted if any(ext in u.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp'])]
            return list(dict.fromkeys(valid_extracted))
            
        except Exception as e:
            print(f"Playwright scraping error for {url}: {e}")
            return []

    def _extract_images_from_text(self, text: str) -> list:
        """
        텍스트(HTML 또는 마크다운) 내에서 이미지 URL을 추출합니다.
        """
        import re
        # HTML img 태그 및 마크다운 이미지 패턴
        html_pattern = r'<img [^>]*src="([^"]+)"'
        md_pattern = r'!\[.*?\]\((.*?)\)'
        
        urls = re.findall(html_pattern, text) + re.findall(md_pattern, text)
        # 확장자 필터링 (jpg, png, webp 등) 및 절대 경로 확인
        valid_urls = [u for u in urls if any(ext in u.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif'])]
        return list(dict.fromkeys(valid_urls)) # 중복 제거

    async def search_and_extract_async(self, topic: str, max_results: int = 5):
        """
        (비동기) 주제와 관련된 아티클을 검색하고 Playwright를 사용하여 정밀하게 이미지를 추출합니다.
        각 아티클당 최대 3개의 고품질 이미지만 선별하여 최적화합니다.
        """
        try:
            # 1. Tavily 검색 (원문 포함)
            search_result = self.client.search(
                query=topic,
                search_depth="advanced",
                include_images=False,
                include_raw_content=True,
                max_results=max_results
            )
            
            articles_data = search_result.get('results', [])
            all_extracted_images = []
            final_articles = []

            # 2. 각 URL에 대해 병렬로 이미지 수집 수행 (최적화)
            async def process_article(res):
                url = res.get('url')
                if not url: return None
                
                print(f"Processing images for: {url}")
                # Playwright 정밀 스크래핑 및 Tavily 원문 추출 병합
                scraped_images = await self._scrape_images_with_playwright(url)
                content_images = self._extract_images_from_text(res.get('raw_content', ''))
                
                # 중복 제거 및 지능형 필터링 (최대 3개 선별)
                combined = list(dict.fromkeys(scraped_images + content_images))
                valid_extracted = self._filter_valid_urls(combined[:10], check_image=True)[:3]
                
                return {
                    'title': res.get('title'),
                    'url': url,
                    'content': res.get('content'),
                    'published_date': res.get('published_date', '날짜 미상'),
                    'associated_images': valid_extracted
                }

            # asyncio.gather를 통한 병렬 처리로 전체 속도 개선
            tasks = [process_article(res) for res in articles_data]
            results = await asyncio.gather(*tasks)
            
            for a in results:
                if a:
                    final_articles.append(a)
                    all_extracted_images.extend(a['associated_images'])

            unique_images = list(dict.fromkeys(all_extracted_images))
            
            # 컨텍스트 생성
            context_text = f"오늘 날짜: {datetime.now().strftime('%Y-%m-%d')}\n\n"
            for i, a in enumerate(final_articles):
                context_text += f"Article {i+1}:\nTitle: {a['title']}\nURL: {a['url']}\nContent: {a['content']}\n"
            
            if unique_images:
                context_text += "\n[Extracted Images from Article Content]\n" + "\n".join(unique_images)

            return {
                "articles": final_articles,
                "context": context_text,
                "images": unique_images
            }

        except Exception as e:
            print(f"CrawlerService (Async) 오류: {e}")
            import traceback
            traceback.print_exc()
            return {"articles": [], "context": "", "images": []}
