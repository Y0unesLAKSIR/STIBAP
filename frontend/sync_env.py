import os

# Paths
BACKEND_ENV = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
FRONTEND_ENV = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env'))

print(f"Reading from: {BACKEND_ENV}")
print(f"Writing to:   {FRONTEND_ENV}")

# Read Backend .env
env_vars = {}
try:
    with open(BACKEND_ENV, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    print("✅ Read backend .env successfully.")
except Exception as e:
    print(f"❌ Failed to read backend .env: {e}")
    exit(1)

# Extract Keys
url = env_vars.get('SUPABASE_URL')
key = env_vars.get('SUPABASE_KEY')

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY in backend .env")
    exit(1)

# Write Frontend .env
try:
    with open(FRONTEND_ENV, 'w') as f:
        f.write(f"REACT_APP_SUPABASE_URL={url}\n")
        f.write(f"REACT_APP_SUPABASE_ANON_KEY={key}\n")
    print("✅ Successfully created frontend .env with correct keys!")
    print(f"URL: {url}")
    print(f"Key: {key[:10]}...")
except Exception as e:
    print(f"❌ Failed to write frontend .env: {e}")
    exit(1)
