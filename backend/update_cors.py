import os

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env'))
NEW_ORIGINS = ["http://localhost:3001", "http://127.0.0.1:3001"]

print(f"Updating .env at: {ENV_PATH}")

env_lines = []
cors_found = False

try:
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r') as f:
            env_lines = f.readlines()

    new_lines = []
    for line in env_lines:
        if line.strip().startswith('CORS_ORIGINS='):
            cors_found = True
            current_val = line.split('=', 1)[1].strip()
            # Remove quotes if present
            if current_val.startswith('"') and current_val.endswith('"'):
                current_val = current_val[1:-1]
            elif current_val.startswith("'") and current_val.endswith("'"):
                current_val = current_val[1:-1]
            
            origins = [o.strip() for o in current_val.split(',') if o.strip()]
            
            # Add new origins if not present
            for new_o in NEW_ORIGINS:
                if new_o not in origins:
                    origins.append(new_o)
            
            new_line = f'CORS_ORIGINS="{",".join(origins)}"\n'
            new_lines.append(new_line)
            print(f"Updated CORS_ORIGINS: {new_line.strip()}")
        else:
            new_lines.append(line)
    
    if not cors_found:
        # Add default + new
        defaults = [
            "http://localhost:3000", "http://127.0.0.1:3000",
            "http://localhost:5173", "http://127.0.0.1:5173"
        ]
        all_origins = defaults + NEW_ORIGINS
        new_line = f'CORS_ORIGINS="{",".join(all_origins)}"\n'
        if new_lines and not new_lines[-1].endswith('\n'):
            new_lines.append('\n')
        new_lines.append(new_line)
        print(f"Added CORS_ORIGINS: {new_line.strip()}")

    with open(ENV_PATH, 'w') as f:
        f.writelines(new_lines)
    
    print("✅ Successfully updated backend .env")

except Exception as e:
    print(f"❌ Error updating .env: {e}")
