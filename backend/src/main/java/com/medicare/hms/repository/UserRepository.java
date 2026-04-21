package com.medicare.hms.repository;

import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    long countByRole(UserRole role);

    List<User> findByRole(UserRole role);
}