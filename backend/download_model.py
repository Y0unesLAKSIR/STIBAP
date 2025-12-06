"""
Manual model downloader with SSL workaround
Run this once to download the model, then start main.py
"""
import ssl
import os
import sys

print("=" * 70)
print(" " * 20 + "STIBAP AI Model Downloader")
print("=" * 70)
print()

# Disable SSL verification for download
print("🔧 Disabling SSL verification...")
ssl._create_default_https_context = ssl._create_unverified_context

# Set environment variables
os.environ['TRANSFORMERS_CACHE'] = './models'
os.environ['HF_HOME'] = './models'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''
os.environ['PYTHONHTTPSVERIFY'] = '0'
print("✓ Environment configured")
print()

# Check if model already exists
model_path = './models/sentence-transformers_all-MiniLM-L6-v2'
if os.path.exists(model_path):
    print("✓ Model already downloaded!")
    print(f"   Location: {model_path}")
    print()
    print("You can run: python main.py")
    sys.exit(0)

print("📥 Downloading model: sentence-transformers/all-MiniLM-L6-v2")
print("   Size: ~90MB")
print("   This may take 5-10 minutes depending on your internet speed...")
print()
print("⏳ Please wait...")
print()

try:
    from sentence_transformers import SentenceTransformer
    
    model = SentenceTransformer(
        'sentence-transformers/all-MiniLM-L6-v2',
        cache_folder='./models'
    )
    
    print()
    print("=" * 70)
    print("✅ SUCCESS! Model downloaded successfully!")
    print("=" * 70)
    print()
    print(f"   Saved to: {model_path}")
    print()
    print("🚀 Next step: Run the backend server")
    print("   Command: python main.py")
    print()
    
except KeyboardInterrupt:
    print()
    print("⚠️  Download cancelled by user")
    sys.exit(1)
    
except Exception as e:
    print()
    print("=" * 70)
    print("❌ DOWNLOAD FAILED")
    print("=" * 70)
    print(f"Error: {e}")
    print()
    print("🔧 SOLUTIONS:")
    print()
    print("1. Check your internet connection")
    print()
    print("2. Try a different network (mobile hotspot, home wifi)")
    print()
    print("3. Disable antivirus/firewall temporarily")
    print()
    print("4. Manual download:")
    print("   - Go to: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2")
    print("   - Download all files from 'Files and versions' tab")
    print("   - Save to: ./models/sentence-transformers_all-MiniLM-L6-v2/")
    print()
    print("5. See FIX_SSL_ERROR.md for more solutions")
    print()
    sys.exit(1)
