package com.medicare.hms.repository;

import com.medicare.hms.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender.id = :userId AND m.receiver.id = :contactId) " +
            "OR (m.sender.id = :contactId AND m.receiver.id = :userId) ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversation(@Param("userId") Long userId, @Param("contactId") Long contactId);

    List<ChatMessage> findByReceiverIdAndSenderIdAndReadMessageFalse(Long receiverId, Long senderId);
}
