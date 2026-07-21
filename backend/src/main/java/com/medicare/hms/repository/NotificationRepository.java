package com.medicare.hms.repository;

import com.medicare.hms.entity.Notification;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Finds a user's notifications newest first.
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // Deletes all notifications for a user.
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteByUserId(Long userId);
}
