package com.application.placementmanagementsystem.services.placementdrive;

import com.application.placementmanagementsystem.auth.CustomUserPrincipal;
import com.application.placementmanagementsystem.dtos.eligibility.EligibilityCriteriaRequest;
import com.application.placementmanagementsystem.dtos.eligibility.EligibilityEvaluationResult;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveCreateRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveSummaryResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveUpdateRequest;
import com.application.placementmanagementsystem.exceptions.InvalidRequestException;
import com.application.placementmanagementsystem.exceptions.ResourceNotFoundException;
import com.application.placementmanagementsystem.mappers.PlacementDriveMapper;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.EligibilityCriteria;
import com.application.placementmanagementsystem.models.Recruiter;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.User;
import com.application.placementmanagementsystem.models.enums.AuditAction;
import com.application.placementmanagementsystem.models.enums.AuditEntityType;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import com.application.placementmanagementsystem.repositories.*;
import com.application.placementmanagementsystem.services.audit.AuditLogService;
import com.application.placementmanagementsystem.services.eligibility.EligibilityEvaluator;
import com.application.placementmanagementsystem.models.enums.NotificationType;
import com.application.placementmanagementsystem.services.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlacementDriveServiceImpl implements PlacementDriveService {

    private final PlacementDriveRepository placementDriveRepository;
    private final EligibilityCriteriaRepository eligibilityCriteriaRepository;
    private final RecruiterRepository recruiterRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final PlacementDriveMapper placementDriveMapper;
    private final NotificationService notificationService;

    private final StudentRepository studentRepository;

    private final EligibilityEvaluator eligibilityEvaluator;

    private static final String DRIVE_NOT_FOUND = "Placement drive not found.";

    @Transactional
    @Override
    public PlacementDriveResponse createPlacementDrive(
            PlacementDriveCreateRequest request
    ) {
        PlacementDrive savedDrive = createPlacementDriveEntity(request);
        return placementDriveMapper.toResponse(savedDrive);
    }

    @Transactional
    @Override
    public PlacementDriveResponse createPlacementDriveWithEligibility(
            PlacementDriveCreateRequest driveRequest,
            EligibilityCriteriaRequest eligibilityRequest
    ) {
        PlacementDrive savedDrive = createPlacementDriveEntity(driveRequest);

        EligibilityCriteria eligibilityCriteria = EligibilityCriteria.builder()
                .placementDrive(savedDrive)
                .minCgpa(eligibilityRequest.getMinCgpa())
                .department(eligibilityRequest.getDepartment())
                .maxBacklogs(eligibilityRequest.getMaxBacklogs())
                .graduationYear(eligibilityRequest.getGraduationYear())
                .build();
        EligibilityCriteria savedEligibility =
                eligibilityCriteriaRepository.save(eligibilityCriteria);
        savedDrive.setEligibilityCriteria(savedEligibility);

        auditLogService.log(
                AuditAction.CREATE,
                AuditEntityType.ELIGIBILITY_CRITERIA,
                savedEligibility.getId(),
                "Created eligibility criteria."
        );

        return placementDriveMapper.toResponse(savedDrive);
    }

    private PlacementDrive createPlacementDriveEntity(PlacementDriveCreateRequest request) {
        Recruiter recruiter = getAuthenticatedRecruiter();
        validateDriveDates(request.getApplicationDeadline(), request.getDriveDate());

        PlacementDrive placementDrive = PlacementDrive.builder()
                .company(recruiter.getCompany())
                .jobRole(request.getJobRole())
                .jobDescription(request.getJobDescription())
                .packageOffered(request.getPackageOffered())
                .location(request.getLocation())
                .applicationDeadline(request.getApplicationDeadline())
                .driveDate(request.getDriveDate())
                .status(DriveStatus.DRAFT)
                .build();

        PlacementDrive savedDrive = placementDriveRepository.save(placementDrive);

        auditLogService.log(
                AuditAction.CREATE,
                AuditEntityType.PLACEMENT_DRIVE,
                savedDrive.getId(),
                "Created placement drive: " + savedDrive.getJobRole()
        );

        return savedDrive;
    }

    @Transactional
    @Override
    public PlacementDriveResponse updatePlacementDrive(
            Long driveId,
            PlacementDriveUpdateRequest request
    ) {
        Recruiter recruiter = getAuthenticatedRecruiter();
        PlacementDrive placementDrive = getOwnedPlacementDrive(driveId, recruiter.getCompany().getId());
        if (placementDrive.getStatus() != DriveStatus.DRAFT) {
            throw new InvalidRequestException("Only DRAFT placement drives can be updated.");
        }
        validateDriveDates(request.getApplicationDeadline(), request.getDriveDate());

        placementDrive.setJobRole(request.getJobRole());
        placementDrive.setJobDescription(request.getJobDescription());
        placementDrive.setPackageOffered(request.getPackageOffered());
        placementDrive.setLocation(request.getLocation());
        placementDrive.setApplicationDeadline(request.getApplicationDeadline());
        placementDrive.setDriveDate(request.getDriveDate());

        PlacementDrive updatedDrive = placementDriveRepository.save(placementDrive);

        auditLogService.log(
                AuditAction.UPDATE,
                AuditEntityType.PLACEMENT_DRIVE,
                updatedDrive.getId(),
                "Updated placement drive: " + updatedDrive.getJobRole()
        );

        return placementDriveMapper.toResponse(updatedDrive);
    }

    @Transactional
    @Override
    public PlacementDriveResponse updatePlacementDriveStatus(
            Long driveId,
            DriveStatus status
    ) {
        Recruiter recruiter = getAuthenticatedRecruiter();
        PlacementDrive placementDrive = getOwnedPlacementDrive(driveId, recruiter.getCompany().getId());
        validateStatusTransition(placementDrive.getStatus(), status);
        if (status == DriveStatus.OPEN &&
                !eligibilityCriteriaRepository.existsByPlacementDriveId(driveId)) {
            throw new InvalidRequestException("Configure eligibility criteria before opening the placement drive.");
        }
        placementDrive.setStatus(status);

        PlacementDrive updatedDrive = placementDriveRepository.save(placementDrive);

        if (status == DriveStatus.OPEN) {
            notifyEligibleStudents(updatedDrive);
        }

        AuditAction action = (status == DriveStatus.OPEN)
                ? AuditAction.PUBLISH
                : AuditAction.UPDATE;

        auditLogService.log(
                action,
                AuditEntityType.PLACEMENT_DRIVE,
                updatedDrive.getId(),
                "Changed drive status to " + status
        );

        return placementDriveMapper.toResponse(updatedDrive);
    }

    @Override
    public PlacementDriveResponse getPlacementDriveById(Long driveId) {
        User user = getAuthenticatedUser();
        PlacementDrive placementDrive;

        switch (user.getRole()) {
            case RECRUITER -> {
                Recruiter recruiter = getAuthenticatedRecruiter();
                placementDrive = placementDriveRepository
                        .findByIdAndCompanyId(
                                driveId,
                                recruiter.getCompany().getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(DRIVE_NOT_FOUND));
            }

            case PLACEMENT_ADMIN ->
                    placementDrive = placementDriveRepository
                            .findByIdAndStatusNot(driveId, DriveStatus.DRAFT)
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(DRIVE_NOT_FOUND));

            case STUDENT ->
                    placementDrive = placementDriveRepository
                            .findByIdAndStatus(driveId, DriveStatus.OPEN)
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(DRIVE_NOT_FOUND));

            default ->
                    throw new IllegalStateException("Unsupported role.");
        }
        return placementDriveMapper.toResponse(placementDrive);
    }

    @Override
    public List<PlacementDriveSummaryResponse> getPlacementDrives() {

        User user = getAuthenticatedUser();
        List<PlacementDrive> placementDrives;

        switch (user.getRole()) {
            case RECRUITER -> {
                Recruiter recruiter = getAuthenticatedRecruiter();
                placementDrives = placementDriveRepository.findByCompanyId(recruiter.getCompany().getId());
            }

            case PLACEMENT_ADMIN ->
                    placementDrives = placementDriveRepository.findByStatusNot(DriveStatus.DRAFT);

            case STUDENT -> {
                Student student = getAuthenticatedStudent();
                placementDrives = placementDriveRepository.findByStatus(DriveStatus.OPEN);
                return placementDrives.stream()
                        .map(drive -> {
                            PlacementDriveSummaryResponse response = placementDriveMapper.toSummaryResponse(drive);
                            EligibilityEvaluationResult evaluation = eligibilityEvaluator.evaluate(student, drive);
                            response.setEligible(evaluation.isEligible());
                            response.setIneligibilityReasons(evaluation.getIneligibilityReasons());
                            return response;
                        })
                        .toList();
            }

            default ->
                    throw new IllegalStateException("Unsupported role.");
        }
        return placementDriveMapper.toSummaryResponseList(placementDrives);
    }

    // Private Helper Methods
    private User getAuthenticatedUser() {
        CustomUserPrincipal principal =
                (CustomUserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        return userRepository.findById(principal.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found."));
    }

    private Student getAuthenticatedStudent() {
        User user = getAuthenticatedUser();
        return studentRepository.findByUser(user)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found."));
    }

    private Recruiter getAuthenticatedRecruiter() {
        User user = getAuthenticatedUser();
        return recruiterRepository.findByUser(user)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Recruiter not found."));
    }

    private PlacementDrive getOwnedPlacementDrive(
            Long driveId,
            Long companyId
    ) {
        return placementDriveRepository
                .findByIdAndCompanyId(driveId, companyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(DRIVE_NOT_FOUND));
    }

    private void notifyEligibleStudents(PlacementDrive placementDrive) {

        List<Student> students = studentRepository.findAll();

        for (Student student : students) {

            EligibilityEvaluationResult evaluation =
                    eligibilityEvaluator.evaluate(student, placementDrive);

            if (evaluation.isEligible()) {

                notificationService.createNotification(
                        student.getUser(),
                        NotificationType.DRIVE,
                        "New Placement Drive Available",
                        placementDrive.getCompany().getCompanyName()
                                + " has published a placement drive for "
                                + placementDrive.getJobRole()
                                + "."
                );
            }
        }
    }

    private void validateDriveDates(
            LocalDate applicationDeadline,
            LocalDate driveDate
    ) {
        if (!driveDate.isAfter(applicationDeadline)) {
            throw new InvalidRequestException("Drive date must be after the application deadline.");
        }
    }

    private void validateStatusTransition(
            DriveStatus currentStatus,
            DriveStatus newStatus
    ) {
        switch (currentStatus) {
            case DRAFT -> {
                if (newStatus != DriveStatus.OPEN) {
                    throw new InvalidRequestException("A draft placement drive can only be opened.");
                }
            }
            case OPEN -> {
                if (newStatus != DriveStatus.CLOSED &&
                        newStatus != DriveStatus.CANCELLED) {
                    throw new InvalidRequestException("An open placement drive can only be closed or cancelled.");
                }
            }
            case CLOSED -> {
                if (newStatus != DriveStatus.COMPLETED) {
                    throw new InvalidRequestException("A closed placement drive can only be marked as completed.");
                }
            }
            default -> throw new InvalidRequestException("Status cannot be changed.");
        }
    }
}