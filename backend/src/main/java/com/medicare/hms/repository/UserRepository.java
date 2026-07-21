package com.medicare.hms.repository;

import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    
    // Finds a user by username.
    Optional<User> findByUsername(String username);

    // Finds a user by email address.
    Optional<User> findByEmail(String email);

    // Counts users assigned to a role.
    long countByRole(UserRole role);

    // Finds users assigned to a role.
    List<User> findByRole(UserRole role);

    // Finds users assigned to a role with profile eagerly fetched.
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.role = :role")
    List<User> findByRoleWithProfile(@Param("role") UserRole role);
}