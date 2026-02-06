import fitz  # PyMuPDF
from PIL import Image
import io
import numpy as np
import gc
import asyncio
import os
import base64
from groq import Groq

# Initialize Groq Client for Vision Analysis
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def encode_image(image_bytes):
    return base64.b64encode(image_bytes).decode('utf-8')

async def perform_groq_ocr(image_bytes):
    """
    Use Groq Vision (Llama 3.2 Vision) to extract text from image.
    Much faster and more reliable than local EasyOCR.
    """
    try:
        base64_image = encode_image(image_bytes)
        print(f"DEBUG: Base64 length: {len(base64_image)}", flush=True)
        print(f"DEBUG: Data URI start: data:image/jpeg;base64,{base64_image[:20]}...", flush=True)
        
        loop = asyncio.get_event_loop()
        completion = await loop.run_in_executor(
            None,
            lambda: groq_client.chat.completions.create(
                model="llama-3.2-90b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Extract ALL text from this image exactly as written. Return ONLY the extracted text, no explanation."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.0,
                max_tokens=2000,
            )
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"DEBUG: Groq OCR Failed: {str(e)}", flush=True)
        return ""

async def extract_text_from_image(image_bytes):
    """
    Extract text using Groq Vision
    """
    try:
        # Resize and Ensure JPEG format
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB (in case of PNG with transparency)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        max_size = 1024 # Reduced from 1500 to be safe
        if max(image.size) > max_size:
            image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
        # Always save as JPEG to match the API data URI
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=75) # Reduced quality for size safety
        image_bytes = buf.getvalue()

        print("DEBUG: Sending image to Groq Vision...", flush=True)
        text = await perform_groq_ocr(image_bytes)
        
        if not text:
             return {"success": False, "error": "No text extracted by Vision API"}

        print(f"DEBUG: Groq Vision success. Output length: {len(text)}", flush=True)
        
        return {
            "success": True,
            "text": text,
            "confidence": 95.0 
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def extract_text_from_pdf(pdf_bytes):
    """
    PDF Strategy:
    1. Try direct text extraction (fastest)
    2. Fallback to Groq Vision for scanned pages
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        all_text = []
        max_pages = min(len(doc), 10)
        
        for page_num in range(max_pages):
            page = doc.load_page(page_num)
            
            # STRATEGY 1: Direct Text (Digital PDFs)
            text = page.get_text().strip()
            if len(text) > 50:
                print(f"DEBUG: [Page {page_num+1}] Direct text found ({len(text)} chars).", flush=True)
                all_text.append(f"--- Page {page_num + 1} ---\n{text}")
                continue
                
            # STRATEGY 2: Groq Vision (Scanned PDFs)
            print(f"DEBUG: [Page {page_num+1}] Scanned page detected. Using Groq Vision...", flush=True)
            
            # Get page as image
            pix = page.get_pixmap(dpi=150)
            # Convert to PIL Image to standardized as JPEG
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            img_data = buf.getvalue()
            
            # Call Vision API
            ocr_text = await perform_groq_ocr(img_data)
            all_text.append(f"--- Page {page_num + 1} (OCR) ---\n{ocr_text}")
            
            # Cleanup
            del pix
            gc.collect()
            
        combined_text = "\n\n".join(all_text)
        
        return {
            "success": True,
            "text": combined_text.strip(),
            "confidence": 90.0
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if 'doc' in locals():
            doc.close()
        gc.collect()

async def extract_text_from_file(file_bytes, file_extension):
    """
    Dispatcher
    """
    if file_extension == 'pdf':
        return await extract_text_from_pdf(file_bytes)
    elif file_extension in ['jpg', 'jpeg', 'png', 'bmp', 'tiff']:
        return await extract_text_from_image(file_bytes)
    else:
        try:
            return {
                "success": True,
                "text": file_bytes.decode('utf-8'),
                "confidence": 100.0
            }
        except:
            return {
                "success": False,
                "error": f"Unsupported file type: {file_extension}"
            }
