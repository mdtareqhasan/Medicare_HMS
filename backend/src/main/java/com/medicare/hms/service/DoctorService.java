package com.medicare.hms.service;

import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import com.medicare.hms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DoctorService {

    private final UserRepository userRepository;

    // Creates the doctor service with its user repository dependency.
    public DoctorService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Returns every user registered with the doctor role.
    @Transactional(readOnly = true)
    public List<User> getAllDoctors() {
        return userRepository.findByRole(UserRole.DOCTOR);
    }
}
