package com.application.placementmanagementsystem.auth;

import com.application.placementmanagementsystem.auth.dtos.*;
import com.application.placementmanagementsystem.auth.jwt.JwtService;
import com.application.placementmanagementsystem.exceptions.ResourceNotFoundException;
import com.application.placementmanagementsystem.models.PasswordResetToken;
import com.application.placementmanagementsystem.models.User;
import com.application.placementmanagementsystem.repositories.UserRepository;
import com.application.placementmanagementsystem.models.enums.AuditAction;
import com.application.placementmanagementsystem.models.enums.AuditEntityType;
import com.application.placementmanagementsystem.services.audit.AuditLogService;
import com.application.placementmanagementsystem.services.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    private final PasswordResetTokenService passwordResetTokenService;
    private final EmailService emailService;

    @Value("${app.mail.frontend-url}")
    private String frontendUrl;

    @Value("${app.name}")
    private String appName;

    private User getAuthenticatedUser() {
        CustomUserPrincipal principal =
                (CustomUserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        return userRepository
                .findById(principal.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found.")
                );
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (user.getRole() != request.role()) {
            throw new BadCredentialsException(("Invalid role selected"));
        }

        String accessToken = jwtService.generateAccessToken((user)).toString();

        auditLogService.log(
                user,
                AuditAction.LOGIN,
                AuditEntityType.USER,
                user.getId(),
                "Logged in."
        );

        return LoginResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .accessToken(accessToken)
                .build();
    }

    public CurrentUserResponse getCurrentUser() {
        var principal = (CustomUserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return CurrentUserResponse.builder()
                .id(principal.getId())
                .fullName(principal.getFullName())
                .email(principal.getEmail())
                .role(principal.getRole())
                .build();
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadCredentialsException(
                    "Current password is incorrect."
            );
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException(
                    "New password must be different from the current password."
            );
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        auditLogService.log(
                AuditAction.UPDATE,
                AuditEntityType.USER,
                user.getId(),
                "Changed password."
        );
    }

    public void forgotPassword(ForgotPasswordRequest request) {

        User user = userRepository.findByEmail(request.email()).orElse(null);

        // Do not reveal whether an account exists for this email.
        if (user == null) return;

        String token = passwordResetTokenService.createToken(user);

        String resetLink = frontendUrl
                + "/reset-password?token="
                + token;

        String subject = "Reset your %s password".formatted(appName);

        String body = """
            Hello %s,

            We received a request to reset your password.

            Use the link below to set a new password:

            %s

            This link will expire in 30 minutes.

            If you did not request a password reset, you can ignore this email.

            %s
            """.formatted(
                user.getFullName(),
                resetLink,
                appName
        );

        emailService.sendEmail(
                user.getEmail(),
                subject,
                body
        );
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenService.validateToken(request.token());
        User user = resetToken.getUser();
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException(
                    "New password must be different from the current password."
            );
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditLogService.log(
                user,
                AuditAction.UPDATE,
                AuditEntityType.USER,
                user.getId(),
                "Reset password."
        );
        passwordResetTokenService.markTokenAsUsed(resetToken);
    }

    // Mostly symbolic in a stateless JWT setup since
    // the token itself remains valid until it expires.
    public void logout() {

        User user = getAuthenticatedUser();

        auditLogService.log(
                AuditAction.LOGOUT,
                AuditEntityType.USER,
                user.getId(),
                "Logged out."
        );

        SecurityContextHolder.clearContext();
    }
}
