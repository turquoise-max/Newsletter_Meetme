from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import asyncio
from dotenv import load_dotenv
import os
from services.ai_generator import AIGeneratorService
from services.crawler import CrawlerService
from services.stibee_client import StibeeClient

load_dotenv()

app = FastAPI(title="AI Newsletter Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_gen = AIGeneratorService()
crawler = CrawlerService()
stibee = StibeeClient()

class NewsletterRequest(BaseModel):
    topic: str
    tone: str = "professional"
    model_type: str = "gemini" # gemini or gpt
    language: str = "ko"
    max_results: int = 5

class Block(BaseModel):
    id: Optional[str] = None
    type: str
    content: dict

class NewsletterResponse(BaseModel):
    title: str
    blocks: List[Block]
    images: List[str] # 전체 이미지 (하위 호환)
    sources: List[dict] # 개별 소스 내 associated_images 포함

@app.get("/")
async def root():
    return {"message": "AI Newsletter Generator API is running"}

@app.post("/api/generate", response_model=NewsletterResponse)
async def generate_newsletter(request: NewsletterRequest):
    try:
        # 1. Expand topic 삭제 -> 원본 주제만 사용
        queries = [request.topic]
        
        # 2. Search & Scrape (Parallel Optimization)
        # 사용자가 요청한 개수(max_results)를 적용하여 병렬 처리
        search_tasks = [crawler.search_and_extract_async(q, max_results=request.max_results) for q in queries]
        search_results = await asyncio.gather(*search_tasks)
        
        all_articles = []
        all_images = []
        combined_context = ""
        
        for i, res in enumerate(search_results):
            all_articles.extend(res.get('articles', []))
            all_images.extend(res.get('images', []))
            combined_context += f"{res.get('context', '')}\n\n"
        
        # Deduplicate images while preserving order
        unique_images = list(dict.fromkeys(all_images))

        # Filter out broken sources (one last safety check)
        valid_sources = [s for s in all_articles if crawler._is_url_valid(s.get('url'))]
        
        # 3. Generate content using AI
        data = ai_gen.generate_newsletter(
            topic=request.topic, 
            raw_context=combined_context, 
            tone=request.tone, 
            model_type=request.model_type,
            articles=valid_sources
        )
            
        # 4. Post-processing: Force Valid URLs and IDs
        blocks = data.get('blocks', [])
        valid_article_urls = [s.get('url') for s in all_articles if s.get('url')]
        
        for i, block in enumerate(blocks):
            # Ensure ID
            if not block.get('id'):
                block['id'] = str(i + 1)
            
            # Link/URL & Image Validation & Injection
            content = block.get('content', {})
            # 리팩토링된 주입 로직 함수 호출
            _process_injection(content, valid_sources, valid_article_urls, unique_images, i)

        return {
            "title": data.get('title', f"{request.topic} 뉴스레터"),
            "blocks": blocks,
            "images": unique_images,
            "sources": all_articles
        }
    except Exception as e:
        print(f"Error during newsletter generation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def _process_injection(content: dict, valid_sources: list, valid_urls: list, all_images: list, index: int):
    """블록에 유효한 링크와 소스 기반 이미지를 주입합니다."""
    try:
        link = content.get('link') or content.get('url')
        current_source = None
        
        # 1. Link Injection
        # valid_urls가 비어있을 경우를 대비해 조건문 보강
        is_invalid_link = not link or "example.com" in link or (valid_urls and link not in valid_urls)
        
        if is_invalid_link:
            if valid_sources:
                current_source = valid_sources[index % len(valid_sources)]
                injected_url = current_source.get('url')
                if 'link' in content: content['link'] = injected_url
                if 'url' in content: content['url'] = injected_url
                link = injected_url
        else:
            current_source = next((s for s in valid_sources if s.get('url') == link), None)

        # 2. Image Injection
        # 소스에 직접 매핑된 이미지가 있으면 최우선 적용
        if current_source and current_source.get('associated_images'):
            content['image_url'] = current_source['associated_images'][0]
        # 이미지가 없거나 전체 풀에 없는 경우(잘못된 URL 등) 대체 이미지 주입
        elif not content.get('image_url') or (all_images and content.get('image_url') not in all_images):
            if all_images:
                content['image_url'] = all_images[index % len(all_images)]
                
        return current_source
    except Exception as e:
        print(f"Injection Error at block index {index}: {e}")
        return None

class PublishRequest(BaseModel):
    title: str
    html: str

@app.post("/api/publish")
async def publish_newsletter(request: PublishRequest):
    try:
        if not stibee:
            return {"status": "error", "message": "Stibee API key is not configured."}
        # Note: In ai-news version, create_and_send_email is synchronous
        result = stibee.create_and_send_email(request.title, request.html)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)