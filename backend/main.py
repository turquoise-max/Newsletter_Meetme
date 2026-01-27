from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
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
# stibee = StibeeClient() # Temporarily disabled due to missing key in .env
stibee = None

class NewsletterRequest(BaseModel):
    topic: str
    tone: str = "professional"
    model_type: str = "gemini" # gemini or gpt
    language: str = "ko"

class Block(BaseModel):
    id: Optional[str] = None
    type: str
    content: dict

class NewsletterResponse(BaseModel):
    title: str
    blocks: List[Block]
    images: List[str]
    sources: List[dict]

@app.get("/")
async def root():
    return {"message": "AI Newsletter Generator API is running"}

@app.post("/api/generate", response_model=NewsletterResponse)
async def generate_newsletter(request: NewsletterRequest):
    try:
        # 1. Expand topic to 3 deep-dive queries
        queries = ai_gen.expand_topic(request.topic)
        
        # 2. Search for all queries and aggregate results
        all_articles = []
        all_images = []
        combined_context = ""
        
        for q in queries:
            res = crawler.search_and_extract(q)
            all_articles.extend(res.get('articles', []))
            all_images.extend(res.get('images', []))
            combined_context += f"--- Query: {q} ---\n{res.get('context', '')}\n\n"
        
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
            
            # Link/URL Validation & Injection
            content = block.get('content', {})
            link = content.get('link') or content.get('url')
            
            # If link is invalid or dummy, inject the most relevant one from sources
            if not link or "example.com" in link or link not in valid_article_urls:
                if valid_article_urls:
                    # Inject a valid source URL based on index or randomly for better coverage
                    injected_url = valid_article_urls[i % len(valid_article_urls)]
                    if 'link' in content: content['link'] = injected_url
                    if 'url' in content: content['url'] = injected_url

        return {
            "title": data.get('title', f"{request.topic} 뉴스레터"),
            "blocks": blocks,
            "images": unique_images,
            "sources": all_articles
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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