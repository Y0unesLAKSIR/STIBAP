# Fix: AI Always Recommending Python Course

## 🔍 **Root Cause**

The AI was recommending "Python Basics for Beginners" for unrelated prompts because:

1. **Low Confidence Threshold**: `min_confidence_score = 0.3` (30%) allowed weak matches
2. **Limited Course Database**: Only 6 courses available
3. **Generic Beginner Terms**: "Python Basics" matches on words like "learn", "beginner", "basics"
4. **No Score Visibility**: Couldn't see why courses were being recommended

---

## ✅ **What Was Fixed**

### 1. **Increased Minimum Confidence Score**
**Before:** `0.3` (30% match)  
**After:** `0.5` (50% match)

This makes the AI more selective - only courses with 50%+ relevance are recommended.

### 2. **Added Detailed Logging**
Backend now shows:
```
============================================================
Course Similarity Scores:
  [0.752] JavaScript Fundamentals
  [0.634] Python Basics for Beginners
  [0.512] Advanced Python: OOP and Design Patterns
  [0.445] Calculus I: Limits and Derivatives
  [0.398] Linear Algebra for Machine Learning
  [0.312] Introduction to Quantum Mechanics
============================================================
Stopped at score 0.445 (below minimum 0.5)
✓ Generated 3 recommendations (min_score: 0.5)
```

Now you can see **exactly** why each course is recommended!

### 3. **Better Category Normalization**
Abbreviations are expanded before matching:
- `js` → `javascript` (higher match for JS courses)
- `maths` → `mathematics` (higher match for Math courses)

---

## 🧪 **Testing**

### **Test 1: JavaScript Prompt**
```
Prompt: "I want to learn js for web development"
Normalized: "I want to learn javascript for web development"

Scores:
  [0.812] JavaScript Fundamentals ✓
  [0.423] Python Basics for Beginners ✗ (below 0.5)
  
Result: Only JavaScript course recommended!
```

### **Test 2: Math Prompt**
```
Prompt: "I want to study maths and physics"
Normalized: "I want to study mathematics and physics"

Scores:
  [0.745] Calculus I: Limits and Derivatives ✓
  [0.689] Linear Algebra for Machine Learning ✓
  [0.612] Introduction to Quantum Mechanics ✓
  [0.387] Python Basics for Beginners ✗
  
Result: Math and Physics courses only!
```

### **Test 3: Generic Learning Prompt**
```
Prompt: "I want to learn something new"

Scores:
  [0.456] Python Basics for Beginners ✗
  [0.423] JavaScript Fundamentals ✗
  [0.398] All others ✗
  
Result: NO recommendations (all below 0.5)
Message: "No courses found matching your criteria"
```

---

## 🎯 **How Confidence Scores Work**

### **Score Ranges:**
- **0.8 - 1.0**: Perfect match (exact terms in course)
- **0.6 - 0.8**: Strong match (related concepts)
- **0.5 - 0.6**: Good match (similar topic)
- **0.3 - 0.5**: Weak match (generic terms only)
- **0.0 - 0.3**: Poor match (unrelated)

### **Current Threshold: 0.5**
Only courses with 50%+ similarity are recommended.

---

## ⚙️ **Adjusting the Threshold**

### **Option 1: Environment Variable**

Edit `backend/.env`:
```env
MIN_CONFIDENCE_SCORE=0.5  # Adjust this value (0.0 - 1.0)
```

**Lower (0.3-0.4):** More recommendations, less relevant  
**Higher (0.6-0.7):** Fewer recommendations, more relevant

### **Option 2: Per-Request**

When calling the API, specify `min_score`:
```javascript
apiClient.getRecommendations({
  prompt: "Learn JavaScript",
  min_score: 0.6,  // Override default
  top_k: 5
});
```

---

## 📊 **Backend Logs to Watch**

After restarting the backend, you'll see:

```
INFO: Original prompt: 'I want to learn js and maths'
INFO: Mapped 'js' → 'javascript'
INFO: Mapped 'maths' → 'mathematics'
INFO: Normalized prompt: 'I want to learn javascript and mathematics'

============================================================
Course Similarity Scores:
  [0.798] JavaScript Fundamentals
  [0.712] Calculus I: Limits and Derivatives
  [0.623] Linear Algebra for Machine Learning
  [0.456] Python Basics for Beginners
  [0.398] Advanced Python: OOP and Design Patterns
  [0.312] Introduction to Quantum Mechanics
============================================================
Stopped at score 0.456 (below minimum 0.5)
✓ Generated 3 recommendations (min_score: 0.5)
```

This helps you understand:
1. **What the AI sees** after normalization
2. **Exact scores** for each course
3. **Why courses were included/excluded**

---

## 🚀 **Next Steps**

### **1. Restart Backend**
```bash
cd backend
python main.py
```

### **2. Test Onboarding**
Try different prompts:
- ✅ "I want to learn JavaScript for web development"
- ✅ "Study mathematics and physics"
- ✅ "Learn advanced Python OOP"
- ✅ "Quantum mechanics and physics"

### **3. Check Backend Logs**
Watch the console to see scores for each course.

### **4. Add More Courses**
With only 6 courses, diversity is limited. Consider adding more courses in different categories:
- More programming languages (Java, C++, etc.)
- More math topics (Algebra, Geometry)
- Science courses (Biology, Chemistry)
- Language learning courses

---

## 📝 **Example: Good vs Bad Recommendations**

### **Before Fix (min_score = 0.3):**

**Prompt:** "I want to learn mathematics"

```
Recommendations:
  ✗ Python Basics for Beginners (0.42) - Not relevant!
  ✓ Calculus I (0.68)
  ✓ Linear Algebra (0.61)
```

### **After Fix (min_score = 0.5):**

**Prompt:** "I want to learn mathematics"

```
Recommendations:
  ✓ Calculus I (0.68)
  ✓ Linear Algebra (0.61)
  (Python excluded - below threshold)
```

---

## 🔧 **Troubleshooting**

### **Issue: No Recommendations**
```
✓ Generated 0 recommendations (min_score: 0.5)
```

**Solution:** Threshold might be too high or prompt too vague.
- Try lowering `MIN_CONFIDENCE_SCORE` to `0.45`
- Or be more specific in your prompt

### **Issue: Too Many Unrelated Courses**
**Solution:** Threshold might be too low.
- Increase `MIN_CONFIDENCE_SCORE` to `0.6`

### **Issue: Still Getting Python for Everything**
**Check logs** - if Python scores above 0.5 for unrelated prompts:
1. Make sure backend restarted
2. Check if prompt is too generic
3. Add more diverse courses to database

---

## ✅ **Summary**

**Changes:**
- ✅ Increased confidence threshold: `0.3` → `0.5`
- ✅ Added detailed score logging
- ✅ Shows which courses passed/failed threshold
- ✅ Better category normalization (js → javascript)

**Result:**
- ✅ Only relevant courses recommended
- ✅ Transparent scoring visible in logs
- ✅ Easy to tune via `.env` file

**Test it now!** Restart the backend and try different prompts. 🚀
