import httpx
from bs4 import BeautifulSoup
import re

async def fetch_url_content(url: str):
    """
    Fetches and extracts text content from a given URL.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove scripts, styles, and other non-text elements
            for script in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                script.decompose()
                
            # Extract text
            text = soup.get_text(separator=' ')
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            clean_text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return {
                "success": True,
                "text": clean_text[:15000],  # Limit to 15k chars to avoid token limits
                "confidence": 100.0,
                "is_url_content": True
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to fetch content: {str(e)}",
            "is_url_content": False
        }

def is_valid_url(text: str) -> bool:
    """
    Simple check if the text is a URL
    """
    text = text.strip()
    # Basic validation
    return text.startswith(("http://", "https://")) and len(text.split()) == 1
