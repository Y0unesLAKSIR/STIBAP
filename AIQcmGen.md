Phase 1: The "Brain" (Spring Boot Microservice) 🧠
Goal: Build a standalone service that can take a subject name and return exam-quality JSON questions.

Project Setup: Initialize ai-question-generator with Spring Web, Lombok, and Spring AI (for Gemini/OpenAI).
DTO Construction: Define strict Java classes (QuestionDTO, OptionDTO) to enforce the Output format.
Prompt Engineering: Create the PromptTemplate that instructs the AI: "You are a strict exam professor. Generate 15 hard questions for {subject} in JSON format..."
Service Logic: Implement the Controller (/api/generate) that calls the AI model and parses the response.
Testing (Standalone): Verify using Postman/Curl that GET /api/generate?subject=Java returns real questions.
Phase 2: The "Bridge" (Backend Integration) 🌉
Goal: Connect your main Python Backend to this new "AI Brain" seamlessly.

Refactor 
qcm_service.py
:
Currently, it reads from a hardcoded list.
Change logic: Check if questions exist in the DB. If NOT -> Call the Spring Boot Microservice (httpx.get).
Fallback Mechanism: If the AI service is down or slow, fall back to the 5 hardcoded questions (so the app never breaks).
Caching: Save the AI-generated questions into your Python backend's memory or database so we don't pay for API calls every time.
Phase 3: The "Face" (Frontend Integration) 🎨
Goal: Update the UI to handle dynamic fetching (loading states) and display 15 questions instead of 5.

Loading State UX: AI generation takes ~3-8 seconds. We need a cool "Generating Assessment..." animation instead of a plain white screen.
Pagination/Scroll: Displaying 15 questions might be long. We might need a "Next/Previous" view or just a clean long-scroll.
Error Handling: If the AI fails, show a friendly message and serve the default questions silently.
Phase 4: The "Polish" (Finalization) ✨
Goal: Optimize cost, speed, and reliability.

Pre-Generation Script: Create a script to "warm up" the cache (generate questions for all 31 subjects overnight).
Rate Limiting: Ensure users can't spam the "Generate" button and drain your API credits.
End-to-End Test: detailed verification from "Click Subject" -> "AI Thinks" -> "Take Quiz" -> "Get Result".
