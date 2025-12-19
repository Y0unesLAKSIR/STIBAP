package ma.emsi.ai_question_generator.controller;

import ma.emsi.ai_question_generator.dto.QuestionDTO;
import ma.emsi.ai_question_generator.service.AiQcmService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController
@RequestMapping("/api/generate")
@CrossOrigin(origins = "*") // Allow access from Python Backend or Frontend
public class AiQcmController {

    private final AiQcmService aiQcmService;

    public AiQcmController(AiQcmService aiQcmService) {
        this.aiQcmService = aiQcmService;
    }

    @GetMapping
    public List<QuestionDTO> generate(@RequestParam String subject) {
        return aiQcmService.generateQuestions(subject);
    }
}
