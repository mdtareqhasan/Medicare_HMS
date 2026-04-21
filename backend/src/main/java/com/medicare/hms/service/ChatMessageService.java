package com.medicare.hms.service;

import com.medicare.hms.entity.ChatMessage;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.ChatMessageRepository;
import com.medicare.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    public List<ChatMessage> getConversation(Long userId, Long contactId) {
        return chatMessageRepository.findConversation(userId, contactId);
    }

    public ChatMessage sendMessage(Long senderId, Long receiverId, String message) {
        User sender = userRepository.findById(senderId).orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setSender(sender);
        chatMessage.setReceiver(receiver);
        chatMessage.setMessage(message);
        chatMessage.setCreatedAt(LocalDateTime.now());
        chatMessage.setReadMessage(false);

        return chatMessageRepository.save(chatMessage);
    }

    public void markConversationAsRead(Long userId, Long contactId) {
        List<ChatMessage> unread = chatMessageRepository.findByReceiverIdAndSenderIdAndReadMessageFalse(userId,
                contactId);
        unread.forEach(msg -> msg.setReadMessage(true));
        chatMessageRepository.saveAll(unread);
    }
}
