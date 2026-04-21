package com.medicare.hms.repository;

import com.medicare.hms.entity.Profile;
import com.medicare.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUser(User user);

    Optional<Profile> findByUserId(Long userId);
}