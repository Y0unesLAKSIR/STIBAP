import os

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env'))
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZWFtbHNhdml0ZWNxZnJ0aWFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3MzE2NiwiZXhwIjoyMDc3MTQ5MTY2fQ.Wc0Qq5T1SINKAb7FS9ppYGlec_ZeQ4HKEZgioku1cS8"

print(f"Updating .env at: {ENV_PATH}")

env_lines = []
key_found = False

try:
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r') as f:
            env_lines = f.readlines()

    new_lines = []
    for line in env_lines:
        if line.strip().startswith('SUPABASE_SERVICE_ROLE_KEY='):
            key_found = True
            new_lines.append(f'SUPABASE_SERVICE_ROLE_KEY={SERVICE_KEY}\n')
            print("Updated existing SUPABASE_SERVICE_ROLE_KEY")
        else:
            new_lines.append(line)
    
    if not key_found:
        if new_lines and not new_lines[-1].endswith('\n'):
            new_lines.append('\n')
        new_lines.append(f'SUPABASE_SERVICE_ROLE_KEY={SERVICE_KEY}\n')
        print("Added new SUPABASE_SERVICE_ROLE_KEY")

    with open(ENV_PATH, 'w') as f:
        f.writelines(new_lines)
    
    print("✅ Successfully updated backend .env with Service Role Key")

except Exception as e:
    print(f"❌ Error updating .env: {e}")
