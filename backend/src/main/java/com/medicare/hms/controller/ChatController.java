package com.medicare.hms.controller;

import com.medicare.hms.entity.ChatMessage;
import com.medicare.hms.service.ChatMessageService;
import com.medicare.hms.dto.UserResponse;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}/{contactId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatMessage>> getConversation(
            @PathVariable Long userId,
            @PathVariable Long contactId) {
        return ResponseEntity.ok(chatMessageService.getConversation(userId, contactId));
    }

    @GetMapping("/users")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserResponse>> getChatContacts(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        var contacts = userRepository.findAll().stream()
                .filter(user -> !user.getUsername().equals(currentUser.getUsername()))
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole().name().toLowerCase()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }

    @PostMapping("/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        Long senderId = Long.valueOf(body.getOrDefault("senderId", "0"));
        Long receiverId = Long.valueOf(body.getOrDefault("receiverId", "0"));
        String message = body.getOrDefault("message", "");

        // Security: Verify that the sender is the authenticated user (prevent message
        // spoofing)
        if (!senderId.equals(currentUser.getId())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only send messages as yourself"));
        }

        if (senderId <= 0 || receiverId <= 0 || message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing sender/receiver/message"));
        }

        ChatMessage saved = chatMessageService.sendMessage(senderId, receiverId, message);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{userId}/{contactId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAsRead(@PathVariable Long userId, @PathVariable Long contactId) {
        chatMessageService.markConversationAsRead(userId, contactId);
        return ResponseEntity.ok(Map.of("message", "Conversation marked as read"));
    }
}
