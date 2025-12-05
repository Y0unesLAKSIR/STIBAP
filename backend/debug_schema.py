import os
from dotenv import load_dotenv
from supabase import create_client

# Load env vars
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY in .env")
    exit(1)

print(f"Connecting to: {url}")
supabase = create_client(url, key)

print("\n--- 1. Testing 'categories' table ---")
try:
    res = supabase.table("categories").select("*").limit(1).execute()
    print("✅ Success! Categories found.")
    print(f"Data sample: {res.data}")
except Exception as e:
    print(f"❌ Failed: {e}")

print("\n--- 2. Testing 'courses' table ---")
try:
    res = supabase.table("courses").select("*").limit(1).execute()
    print("✅ Success! Courses found.")
    print(f"Data sample: {res.data}")
except Exception as e:
    print(f"❌ Failed: {e}")

print("\n--- 3. Testing Relationship (courses -> categories) ---")
try:
    # This is the exact query that is failing in the backend
    res = supabase.table("courses").select("*, category:categories(*)").limit(1).execute()
    print("✅ Success! Relationship is working.")
except Exception as e:
    print(f"❌ Failed: {e}")
    print("\nPossible Causes:")
    print("1. Schema Cache not reloaded (Go to Supabase -> API Settings -> Reload Schema Cache)")
    print("2. Foreign Key missing (Did the SQL script run completely?)")
