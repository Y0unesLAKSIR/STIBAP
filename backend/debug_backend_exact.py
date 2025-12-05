import os
from dotenv import load_dotenv
from config import settings
from supabase import create_client, Client

if __name__ == "__main__":
    print("--- Debugging Backend Configuration ---")
    print(f"Settings URL: {settings.supabase_url}")
    print(f"Settings Key: {settings.supabase_key}")
    
    load_dotenv()
    env_key = os.environ.get("SUPABASE_KEY")
    
    # FORCE use of Anon Key from ENV
    supabase_key = env_key
    print(f"Using Env Key: {supabase_key[:10]}...")
    client: Client = create_client(
        settings.supabase_url,
        supabase_key
    )
    
    print("\n--- Attempting Exact Backend Query ---")
    try:
        # Exact query from debug_schema.py
        response = client.table('courses')\
            .select('*, category:categories(*)')\
            .limit(1)\
            .execute()
            
        print("✅ Query Successful!")
        print(f"Rows returned: {len(response.data)}")
    except Exception as e:
        print(f"❌ Query Failed: {e}")
        import traceback
        traceback.print_exc()
