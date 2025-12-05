import os
from dotenv import load_dotenv
from supabase import create_client, Client
import socket

# Load env vars
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"Testing connection to: {url}")
print(f"Key length: {len(key) if key else 0}")

# 1. Test DNS resolution
try:
    hostname = url.replace("https://", "").replace("http://", "").split("/")[0]
    print(f"Resolving hostname: {hostname}")
    ip = socket.gethostbyname(hostname)
    print(f"Resolved to IP: {ip}")
except Exception as e:
    print(f"DNS Resolution Failed: {e}")

# 2. Test Supabase Client
try:
    supabase: Client = create_client(url, key)
    print("Client created. Attempting request...")
    # Try a simple health check or table list (this might fail if table doesn't exist, but we want to see IF it connects)
    response = supabase.table("categories").select("count", count="exact").execute()
    print("Connection Successful!")
    print(response)
except Exception as e:
    print(f"Supabase Connection Failed: {e}")
