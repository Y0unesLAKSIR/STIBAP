package ma.emsi.ai_question_generator.service;

import ma.emsi.ai_question_generator.dto.QcmResponseDTO;
import ma.emsi.ai_question_generator.dto.QuestionDTO;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.List;
import java.util.Map;

@Service
public class AiQcmService {

        private final ChatClient chatClient;
        private final ObjectMapper objectMapper;

        // Constructor Injection
        public AiQcmService(ChatClient chatClient, ObjectMapper objectMapper) {
                this.chatClient = chatClient;
                this.objectMapper = objectMapper;
        }

        public List<QuestionDTO> generateQuestions(String subject) {
                String templateDetails = """
                                You are an expert professor in {subject}.
                                Generate 15 multiple-choice questions (QCM) for university-level students about {subject}.

                                Strictly return a valid JSON array of objects. Do not wrap in markdown code blocks.
                                Each object must have the following fields:
                                - "id" (unique number)
                                - "text" (the question)
                                - "options" (array of 4 strings)
                                - "correctIndex" (integer 0-3)
                                - "category" (string)
                                """;

                PromptTemplate promptTemplate = new PromptTemplate(templateDetails);
                Prompt prompt = promptTemplate.create(Map.of("subject", subject));

                String content;
                try {
                        content = chatClient.call(prompt).getResult().getOutput().getContent();
                } catch (Exception e) {
                        System.err.println("AI API Failed: " + e.getMessage());
                        System.err.println("Falling back to MOCK generator.");
                        return generateMockQuestions(subject);
                }

                // Robustly extract JSON array
                int start = content.indexOf("[");
                int end = content.lastIndexOf("]");

                if (start != -1 && end != -1) {
                        content = content.substring(start, end + 1);
                } else {
                        System.err.println("AI Response did not contain a JSON array: " + content);
                        return generateMockQuestions(subject);
                }

                try {
                        return objectMapper.readValue(content, new TypeReference<List<QuestionDTO>>() {
                        });
                } catch (Exception e) {
                        System.err.println("Failed to parse AI response: " + e.getMessage());
                        return generateMockQuestions(subject);
                }
        }

        private List<QuestionDTO> generateMockQuestions(String subject) {
                System.out.println("Generating fallback questions for: " + subject);
                return MockQuestionBank.getQuestions(subject);
        }
}
