import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print(f"Connecting to: {url}")

print("\n--- Inspecting 'courses' table structure ---")
try:
    # Try to insert a dummy row with just title to see what columns are returned in error or success
    # Or better, try to select * and see keys
    res = supabase.table("courses").select("*").limit(1).execute()
    if res.data:
        print("Columns found in API response:")
        print(res.data[0].keys())
    else:
        print("No rows found. Attempting to insert dummy to trigger schema validation...")
        try:
            # Insert with minimal required fields
            res = supabase.table("courses").insert({
                "title": "Debug Column Check",
                "description": "Checking columns",
                "category_id": "00000000-0000-0000-0000-000000000000" # Intentionally invalid UUID to check if column exists
            }).execute()
        except Exception as e:
            print(f"Insert Error: {e}")
            
except Exception as e:
    print(f"Select Error: {e}")
