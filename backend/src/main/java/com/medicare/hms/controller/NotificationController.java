package com.medicare.hms.controller;

import com.medicare.hms.entity.Notification;
import com.medicare.hms.security.UserDetailsImpl;
import com.medicare.hms.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Notification> getNotifications(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return notificationService.getUserNotifications(currentUser.getUsername());
    }

    @PutMapping("/mark-all-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAllRead(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        notificationService.markAllRead(currentUser.getUsername());
        return ResponseEntity.ok(Map.of("message", "Marked all as read"));
    }

    @PutMapping("/{id}/mark-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        notificationService.markRead(currentUser.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }
}
