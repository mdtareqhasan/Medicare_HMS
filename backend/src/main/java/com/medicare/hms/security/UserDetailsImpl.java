package com.medicare.hms.security;

import com.medicare.hms.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private Long id;

    private String username;

    private String email;

    @JsonIgnore
    private String password;

    private Collection<? extends GrantedAuthority> authorities;

    // Creates the immutable security principal used by Spring Security.
    public UserDetailsImpl(Long id, String username, String email, String password,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
    }

    // Builds Spring Security user details from an application user entity.
    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities);
    }

    // Returns granted roles and permissions for Spring Security.
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    // Returns the authenticated user id.
    public Long getId() {
        return id;
    }

    // Returns the authenticated user email address.
    public String getEmail() {
        return email;
    }

    // Returns the password hash required by Spring Security.
    @Override
    public String getPassword() {
        return password;
    }

    // Returns the username used by Spring Security.
    @Override
    public String getUsername() {
        return username;
    }

    // Reports whether the account is still valid for authentication.
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // Reports whether the account is not locked.
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // Reports whether stored credentials are still valid.
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // Reports whether the account is enabled.
    @Override
    public boolean isEnabled() {
        return true;
    }

    // Compares users by id for security identity checks.
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }

    // Builds the hash code from the user id.
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
