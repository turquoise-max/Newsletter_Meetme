import os
import requests
import asyncio
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

    def _is_url_valid(self, url: str) -> bool:
        """
        URL이 유효하고 접근 가능한지 확인합니다.
        이미지 또는 페이지의 존재 여부를 3초 내에 체크하며, 브라우저 환경을 흉내냅니다.
        """
        if not url or not url.startswith('http'):
            return False
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }

        try:
            # 1. 먼저 HEAD 요청으로 가볍게 확인
            response = requests.head(url, headers=headers, timeout=3.0, allow_redirects=True)
            if response.status_code == 200:
                return True
        except:
            pass

        try:
            # 2. HEAD 실패 시 GET으로 짧게 시도 (일부 사이트는 HEAD를 차단함)
            # stream=True로 설정하여 본문 다운로드는 피함
            response = requests.get(url, headers=headers, timeout=3.0, stream=True, allow_redirects=True)
            return response.status_code == 200
        except:
            return False

    def _filter_valid_urls(self, urls: list) -> list:
        """
        병렬로 URL 유효성을 검사하여 유효한 것만 반환합니다.
        """
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(self._is_url_valid, urls))
        return [url for url, is_valid in zip(urls, results) if is_valid]

    def search_and_extract(self, topic: str, max_results: int = 5):
        """
        주제와 관련된 아티클을 검색하고 내용을 추출합니다.
        유효한 링크와 이미지만 선별합니다.
        """
        try:
            # LLM에 최적화된 콘텐츠를 직접 가져오기 위해 검색 컨텍스트를 사용합니다.
            response = self.client.get_search_context(
                query=topic,
                search_depth="advanced",
                max_tokens=8000, # 토큰 사용량 제어
                max_results=max_results
            )
            
            # 이미지나 제목 같은 메타데이터가 필요하므로 'search' 메서드도 함께 사용할 수 있습니다.
            # 여기서는 메타데이터(이미지, 제목, 날짜) 확보를 위해 search를 메인으로 사용합니다.
            search_result = self.client.search(
                query=topic,
                search_depth="advanced",
                include_images=True,
                include_raw_content=False,
                include_answer=False,
                max_results=max_results
            )
            
            articles = []
            raw_article_urls = [r.get('url') for r in search_result.get('results', [])]
            valid_article_urls = self._filter_valid_urls(raw_article_urls)

            for result in search_result.get('results', []):
                url = result.get('url')
                if url in valid_article_urls:
                    articles.append({
                        'title': result.get('title'),
                        'url': url,
                        'content': result.get('content'),
                        'published_date': result.get('published_date', '날짜 미상')
                    })
                
            # 이미지 매핑을 위해 각 아티클에 이미지 정보 추가 시도
            
            # LLM 컨텍스트용으로 콘텐츠 결합 (작성일 포함)
            context_text = f"오늘 날짜: {os.popen('date +%Y-%m-%d').read().strip()}\n\n"
            for i, a in enumerate(articles):
                context_text += f"Article {i+1}:\nTitle: {a['title']}\nPublished Date: {a['published_date']}\nURL: {a['url']}\nContent: {a['content']}\n"
            
            # 수집된 이미지 리스트 필터링
            raw_images = search_result.get('images', [])
            collected_images = self._filter_valid_urls(raw_images)
            
            # 컨텍스트에 이미지 리스트도 텍스트로 추가하여 AI가 참고할 수 있게 함
            if collected_images:
                context_text += "\n[Available Images from Search]\n" + "\n".join(collected_images)

            return {
                "articles": articles,
                "context": context_text,
                "images": collected_images
            }

        except Exception as e:
            print(f"CrawlerService 오류: {e}")
            return {"articles": [], "context": "", "images": []}
