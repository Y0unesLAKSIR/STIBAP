package ma.emsi.ai_question_generator.dto;

import lombok.Data;
import java.util.List;

@Data
public class QcmResponseDTO {
    private String subject;
    private List<QuestionDTO> questions;
}
