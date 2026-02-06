from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
from services.ocr_service import extract_text_from_file
from services.analysis_service import analyze_document
import json

app = FastAPI(title="Civic Translator Backend")

# CORS configuration for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Removed simple root route to allow static file serving or catch-all
# @app.get("/")
# async def root():
#     return {"status": "Civic Translator Backend Running", "version": "1.0.0"}

import time
import uuid
import traceback

@app.post("/api/process-document")
async def process_document(
    file: UploadFile = File(...),
    user_context: str = Form(...)
):
    request_id = str(uuid.uuid4())[:8]
    print(f"\n{'='*60}", flush=True)
    print(f"[{request_id}] ⚡ REQUEST RECEIVED", flush=True)
    print(f"[{request_id}] File: {file.filename}", flush=True)
    print(f"[{request_id}] Content-Type: {file.content_type}", flush=True)
    print(f"{'='*60}\n", flush=True)
    """
    Complete pipeline with memory protection
    """
    # Memory Safety: Reject files larger than 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB
    
    try:
        # Check size without loading entire file into memory
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
        
        print(f"[{request_id}] File Size Check: {file_size} bytes", flush=True)
        
        if file_size > MAX_FILE_SIZE:
            return JSONResponse(
                status_code=413,
                content={"error": "File too large", "details": "Please upload a document smaller than 10MB."}
            )

        # Parse user context
        context = json.loads(user_context)
        
        print(f"[{request_id}] STEP 1: Starting OCR...", flush=True)
        
        # TEMPORARY BYPASS: Skip OCR and use mock text for testing
        USE_MOCK_OCR = False  # Set to False to use real OCR
        
        if USE_MOCK_OCR:
            print(f"[{request_id}] ⚠️ USING MOCK OCR (BYPASS MODE)", flush=True)
            extracted_text = "This is a government scheme notification about PM Awas Yojana housing benefits for eligible citizens."
            confidence = 95.0
            print(f"[{request_id}] Mock OCR complete. Text length: {len(extracted_text)}", flush=True)
        else:
            # Step 1: File/Content Processing
            file_bytes = await file.read()
            file_extension = file.filename.split('.')[-1].lower()
            
            # Check for URL in text file (Frontend sends URL as input.txt)
            is_url = False
            if file_extension == 'txt':
                content = file_bytes.decode('utf-8').strip()
                if content.startswith(('http://', 'https://')) and len(content.split()) == 1:
                    is_url = True
                    print(f"[{request_id}] 🔗 URL DETECTED: {content}", flush=True)
                    
            if is_url:
                from services.web_service import fetch_url_content
                url_content = await fetch_url_content(content)
                if url_content["success"]:
                     extracted_text = url_content["text"]
                     confidence = 100.0
                     print(f"[{request_id}] URL FETCH SUCCESS. Length: {len(extracted_text)}", flush=True)
                else:
                     return JSONResponse(status_code=400, content={"error": "URL processing failed", "details": url_content["error"]})
            else:
                # Normal File Processing
                ocr_result = await extract_text_from_file(file_bytes, file_extension)
                
                if not ocr_result["success"]:
                    print(f"[{request_id}] OCR FAILED: {ocr_result.get('error')}", flush=True)
                    return JSONResponse(
                        status_code=400,
                        content={"error": "OCR failed", "details": ocr_result.get("error")}
                    )
                
                extracted_text = ocr_result["text"]
                confidence = ocr_result.get("confidence", 0)
                
                print(f"[{request_id}] OCR SUCCESS. Text Length: {len(extracted_text)}", flush=True)
                if len(extracted_text) < 10:
                     print(f"[{request_id}] WARNING: Very short text extracted: '{extracted_text}'", flush=True)
             
        # Step 2-6: Analysis pipeline (Classification, Extraction, Translation)
        print(f"[{request_id}] CALLING AI ANALYSIS...", flush=True)
        analysis_result = await analyze_document(extracted_text, context)
        print(f"[{request_id}] AI ANALYSIS COMPLETE. Result Type: {analysis_result.get('type')}", flush=True)
        
        # Add OCR metadata
        analysis_result["ocr_confidence"] = confidence
        analysis_result["extracted_text_length"] = len(extracted_text)
        analysis_result["request_id"] = request_id
        
        headers = {"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"}
        return JSONResponse(content=analysis_result, headers=headers)
        
    except Exception as e:
        print(f"[{request_id}] CRITICAL ERROR: {str(e)}", flush=True)
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": "Processing failed", "details": str(e), "request_id": request_id}
        )

@app.post("/api/ocr-only")
async def ocr_only(file: UploadFile = File(...)):
    """
    OCR endpoint for testing
    """
    try:
        file_bytes = await file.read()
        file_extension = file.filename.split('.')[-1].lower()
        
        result = await extract_text_from_file(file_bytes, file_extension)
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "OCR failed", "details": str(e)}
        )
# TTS Endpoint
from services.tts_service import generate_speech
from fastapi.responses import Response

class SpeakRequest(BaseModel):
    text: str
    language: str = 'en'

@app.post("/api/speak")
async def speak(request: SpeakRequest):
    try:
        if not request.text:
            return JSONResponse(status_code=400, content={"error": "Text is required"})
            
        audio_content = await generate_speech(request.text, request.language)
        
        return Response(content=audio_content, media_type="audio/mpeg")
    except Exception as e:
        print(f"TTS Error: {str(e)}", flush=True)
        return JSONResponse(status_code=500, content={"error": str(e)})

# Serve Static Files (Frontend)
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "out")

if os.path.exists(frontend_path):
    # Mount the static files
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    
    # Catch-all route to serve index.html for SPA routing
    @app.middleware("http")
    async def catch_all_spa(request: Request, call_next):
        # Only log API requests to reduce noise
        if request.url.path.startswith("/api"):
            print(f"🌐 API REQUEST: {request.method} {request.url.path}", flush=True)
        
        response = await call_next(request)
        
        if request.url.path.startswith("/api"):
            process_time = time.time() - time.time()  # Will be calculated properly by uvicorn
            print(f"✅ API RESPONSE: {request.method} {request.url.path} - Status {response.status_code}", flush=True)
        
        if response.status_code == 404 and not request.url.path.startswith("/api"):
            return FileResponse(os.path.join(frontend_path, "index.html"))
        return response
else:
    print(f"Warning: Frontend path {frontend_path} not found. UI will not be served.")

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("SERVE READY: Access the app at http://localhost:8000")
    print("="*50 + "\n", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8000)
