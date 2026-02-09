import os
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key[:15]}..." if api_key else "No API key found!")

if api_key:
    genai.configure(api_key=api_key)
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content("Say hi")
        print(f"✅ Success! Response: {response.text}")
    except Exception as e:
        print(f"❌ Full error: {type(e).__name__}: {e}")
