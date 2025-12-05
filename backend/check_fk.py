import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print("Checking Foreign Keys for 'courses' table...")

try:
    # Query information_schema via RPC or direct table access if allowed
    # Note: Direct access to information_schema might be blocked by RLS, but usually readable by anon
    # We'll try to use a raw SQL query via RPC if possible, but we don't have an RPC for that.
    # So we'll try to select from the table definition if Supabase exposes it, 
    # OR we just infer it from the error.
    
    # Actually, we can't easily query information_schema via the JS/Python client unless exposed.
    # But we can try to insert a row with an invalid category_id. 
    # If it fails with FK violation, the FK exists!
    
    print("Attempting to insert a course with INVALID category_id...")
    res = supabase.table("courses").insert({
        "title": "Test FK",
        "description": "Test",
        "category_id": "00000000-0000-0000-0000-000000000000", # Invalid UUID
        "difficulty_id": None
    }).execute()
    
    print("❌ Insert succeeded? That means FK is MISSING!")
    # Clean up
    if res.data:
        supabase.table("courses").delete().eq("id", res.data[0]['id']).execute()
        
except Exception as e:
    msg = str(e)
    if "foreign key constraint" in msg.lower():
        print("✅ Insert failed with FK violation! The Foreign Key EXISTS.")
    else:
        print(f"⚠️ Insert failed with other error: {msg}")

