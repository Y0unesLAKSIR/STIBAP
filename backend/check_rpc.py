import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print(f"Connecting to: {url}")

print("\n--- Checking for 'register_user' RPC ---")
try:
    # Try to call the RPC with dummy data
    # If it exists, it might return an error (invalid email etc) or success
    # If it DOES NOT exist, it will return a specific error
    res = supabase.rpc('register_user', {
        'p_email': 'test@example.com',
        'p_password': 'password123',
        'p_full_name': 'Test User'
    }).execute()
    
    print("✅ RPC 'register_user' EXISTS (Result received)")
    print(res)
except Exception as e:
    msg = str(e)
    if "function register_user" in msg and "does not exist" in msg:
        print("❌ RPC 'register_user' DOES NOT EXIST!")
    elif "Could not find the function" in msg:
        print("❌ RPC 'register_user' DOES NOT EXIST!")
    else:
        print(f"⚠️ RPC exists but returned error: {msg}")
