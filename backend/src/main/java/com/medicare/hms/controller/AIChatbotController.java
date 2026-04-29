package com.medicare.hms.controller;

import com.medicare.hms.service.AIChatbotService;
import com.medicare.hms.service.AIChatbotService.AIChatbotException;
import com.medicare.hms.service.AIChatbotService.ChatHistoryMessage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin
public class AIChatbotController {

    private final AIChatbotService aiChatbotService;

    public AIChatbotController(AIChatbotService aiChatbotService) {
        this.aiChatbotService = aiChatbotService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@Valid @RequestBody AIChatRequest request) {
        try {
            String reply = aiChatbotService.chat(request.message(), request.role(), request.history());
            return ResponseEntity.ok(new AIChatResponse(reply));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (AIChatbotException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", ex.getMessage()));
        }
    }

    public record AIChatRequest(
            @NotBlank(message = "Message is required") String message,
            String role,
            List<ChatHistoryMessage> history) {
    }

    public record AIChatResponse(String reply) {
    }
}
