package ma.emsi.ai_question_generator.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuestionDTO {
    private int id;
    private String text;
    private List<String> options;
    private int correctIndex;
    private String category;
    private String difficulty; // easy, medium, hard
    private String explanation;
}
