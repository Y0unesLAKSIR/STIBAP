# Fix SSL Download Error

## The Problem

The AI model download from HuggingFace is failing due to SSL certificate issues. This is common with:
- Corporate firewalls
- Antivirus software
- VPN connections
- Network proxies

## ✅ Solution 1: Use the Download Script (Recommended)

I've added SSL workarounds to the code. Try running main.py again:

```bash
python main.py
```

The modified `ai_engine.py` now includes SSL certificate bypass at the top of the file.

---

## ✅ Solution 2: Download Model Separately

If Solution 1 still fails, use the dedicated downloader:

```bash
python download_model.py
```

This script:
- Disables SSL verification
- Sets environment variables
- Downloads the model to `./models/`
- Then you can run `python main.py`

---

## ✅ Solution 3: Manual Download

If both scripts fail, download manually:

### Step 1: Download from Browser

Go to: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/main

Download these files:
- `config.json`
- `pytorch_model.bin` or `model.safetensors` (~90MB)
- `tokenizer_config.json`
- `vocab.txt`
- `special_tokens_map.json`
- `modules.json`
- `sentence_bert_config.json`

### Step 2: Create Folder Structure

```
backend/
└── models/
    └── sentence-transformers_all-MiniLM-L6-v2/
        ├── config.json
        ├── model.safetensors
        ├── tokenizer_config.json
        ├── vocab.txt
        ├── special_tokens_map.json
        ├── modules.json
        └── sentence_bert_config.json
```

### Step 3: Run Backend

```bash
python main.py
```

Should now load from local cache!

---

## ✅ Solution 4: Use Environment Variables

Add to your terminal before running:

### Windows (PowerShell):
```powershell
$env:CURL_CA_BUNDLE=""
$env:REQUESTS_CA_BUNDLE=""
python main.py
```

### Windows (CMD):
```cmd
set CURL_CA_BUNDLE=
set REQUESTS_CA_BUNDLE=
python main.py
```

---

## ✅ Solution 5: Check Antivirus/Firewall

Some antivirus software blocks SSL connections:

1. **Temporarily disable** antivirus SSL scanning
2. **Add exception** for Python/pip in firewall
3. **Whitelist** huggingface.co domain

---

## ✅ Solution 6: Use Different Network

If on corporate/school network:
- Try mobile hotspot
- Try home network
- Try VPN (or disable VPN if using one)

---

## ✅ Solution 7: Upgrade Python SSL

```bash
pip install --upgrade certifi urllib3 requests
```

---

## Verify Download Worked

After successful download, you should see:

```
backend/
└── models/
    └── sentence-transformers_all-MiniLM-L6-v2/
        └── [model files]
```

Then running `python main.py` should show:
```
INFO:     Loading model: sentence-transformers/all-MiniLM-L6-v2
INFO:     Model loaded successfully  ✓
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Still Not Working?

### Check 1: Is models folder created?
```bash
dir models  # Should show sentence-transformers_all-MiniLM-L6-v2
```

### Check 2: Python version
```bash
python --version  # Should be 3.8+
```

### Check 3: Internet connection
```bash
ping huggingface.co
```

### Check 4: Try pip with no SSL
```bash
pip install sentence-transformers --trusted-host pypi.org --trusted-host files.pythonhosted.org
```

---

## Quick Test

After fixing, test with:

```bash
python -c "from sentence_transformers import SentenceTransformer; model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', cache_folder='./models'); print('✓ Model loaded!')"
```

Should print: `✓ Model loaded!`

---

## Alternative: Use Pre-downloaded Model

If all else fails, I can provide instructions to use a lighter model or work without AI temporarily.

But try the solutions above first - they work in 99% of cases!
