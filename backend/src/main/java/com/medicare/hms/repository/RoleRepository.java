package com.medicare.hms.repository;

import com.medicare.hms.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    // Finds a role by its stored name.
    Optional<Role> findByName(String name);
}