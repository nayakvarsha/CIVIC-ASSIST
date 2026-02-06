
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Mock the Groq client to avoid actual API calls if needed, 
# but here we want to test the REAl prompt so we will use the real service if API key is present.
# Ideally we should use the real service to see if the LLM respects the JSON format.

from services.analysis_service import analyze_document

async def test_analysis():
    print("Testing Analysis Service with Master Prompt...")
    
    mock_text = """
    GOVERNMENT OF INDIA
    MINISTRY OF RURAL DEVELOPMENT
    
    PRADHAN MANTRI AWAS YOJANA (GRAMIN)
    
    To,
    Mr. Rahul Kumar
    Village: Rampur, District: Patna
    
    Subject: Approval of Housing Assistance
    
    Dear Beneficiary,
    You are hereby informed that your application for housing assistance under PMAY-G has been approved.
    You are entitled to receive Rs. 1,20,000 in three installments.
    
    First installment: Rs. 40,000 (Released on 10/02/2025)
    
    Please ensure your bank account is linked.
    
    Signed,
    Block Development Officer
    """
    
    user_context = {
        "occupation": "Farmer",
        "location": "Bihar",
        "language": "hi" # Requesting Hindi response
    }
    
    try:
        if not os.getenv("GROQ_API_KEY"):
            print("SKIPPING: No GROQ_API_KEY found in environment.")
            return

        result = await analyze_document(mock_text, user_context)
        
        print("\n--- Analysis Result ---")
        import json
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # specific checks
        if "voice_script" in result:
            print("\n✅ 'voice_script' field is present.")
        else:
            print("\n❌ 'voice_script' field is MISSING.")
            
        if result.get("type") == "scheme":
             print("✅ Document type identified correctly.")
        
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_analysis())
