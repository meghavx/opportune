package com.application.placementmanagementsystem.services.placementdrive;

import com.application.placementmanagementsystem.auth.CustomUserPrincipal;
import com.application.placementmanagementsystem.dtos.eligibility.EligibilityCriteriaRequest;
import com.application.placementmanagementsystem.dtos.eligibility.EligibilityEvaluationResult;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveCreateRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.JobDescriptionDocumentContent;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveSummaryResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveUpdateRequest;
import com.application.placementmanagementsystem.exceptions.InvalidRequestException;
import com.application.placementmanagementsystem.exceptions.ResourceNotFoundException;
import com.application.placementmanagementsystem.mappers.PlacementDriveMapper;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.PlacementDriveJdDocument;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlacementDriveServiceImpl implements PlacementDriveService {

    private final PlacementDriveRepository placementDriveRepository;
    private final PlacementDriveJdDocumentRepository placementDriveJdDocumentRepository;
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
                .requiredSkills(normalizeSkills(request.getRequiredSkills()))
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
        if (request.getRequiredSkills() != null) {
            placementDrive.setRequiredSkills(normalizeSkills(request.getRequiredSkills()));
        }
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
    public String uploadJobDescriptionDocument(Long driveId, MultipartFile file) {
        Recruiter recruiter = getAuthenticatedRecruiter();
        PlacementDrive drive = getOwnedPlacementDrive(
                driveId,
                recruiter.getCompany().getId()
        );
        if (drive.getStatus() != DriveStatus.DRAFT) {
            throw new InvalidRequestException("Only DRAFT placement drives can be updated.");
        }
        validateJobDescriptionFile(file);
        String fileName = sanitizeFileName(file.getOriginalFilename());
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the uploaded job description.");
        }
        validateJobDescriptionFileContents(fileName, fileBytes);

        PlacementDriveJdDocument document = placementDriveJdDocumentRepository
                .findById(driveId)
                .orElseGet(() -> PlacementDriveJdDocument.builder()
                        .placementDrive(drive)
                        .build());
        document.setFile(fileBytes);
        document.setPlacementDrive(drive);
        placementDriveJdDocumentRepository.save(document);
        drive.setJobDescriptionFileName(fileName);
        placementDriveRepository.save(drive);
        auditLogService.log(
                AuditAction.UPDATE,
                AuditEntityType.PLACEMENT_DRIVE,
                driveId,
                "Attached job description document."
        );
        return fileName;
    }

    @Override
    public JobDescriptionDocumentContent downloadJobDescriptionDocument(Long driveId) {
        PlacementDrive drive = getPlacementDriveForCurrentUser(driveId);
        if (drive.getJobDescriptionFileName() == null) {
            throw new ResourceNotFoundException("Job description document not found.");
        }

        PlacementDriveJdDocument document = placementDriveJdDocumentRepository
                .findById(driveId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Job description document not found."));
        return new JobDescriptionDocumentContent(
                drive.getJobDescriptionFileName(),
                document.getFile()
        );
    }

    @Transactional
    @Override
    public void deleteJobDescriptionDocument(Long driveId) {
        Recruiter recruiter = getAuthenticatedRecruiter();
        PlacementDrive drive = getOwnedPlacementDrive(
                driveId,
                recruiter.getCompany().getId()
        );
        if (drive.getStatus() != DriveStatus.DRAFT) {
            throw new InvalidRequestException("Only DRAFT placement drives can be updated.");
        }
        placementDriveJdDocumentRepository.deleteById(driveId);
        drive.setJobDescriptionFileName(null);
        placementDriveRepository.save(drive);
        auditLogService.log(
                AuditAction.UPDATE,
                AuditEntityType.PLACEMENT_DRIVE,
                driveId,
                "Removed job description document."
        );
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
    public List<PlacementDriveSummaryResponse> getPlacementDrives(boolean showBestMatches) {

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
                List<PlacementDriveSummaryResponse> responses = placementDrives.stream()
                        .map(drive -> {
                            PlacementDriveSummaryResponse response = placementDriveMapper.toSummaryResponse(drive);
                            EligibilityEvaluationResult evaluation = eligibilityEvaluator.evaluate(student, drive);
                            response.setEligible(evaluation.isEligible());
                            response.setIneligibilityReasons(evaluation.getIneligibilityReasons());
                            if (showBestMatches && evaluation.isEligible()) {
                                applySkillMatch(student, drive, response);
                            }
                            return response;
                        })
                        .toList();
                if (!showBestMatches) {
                    return responses;
                }
                return responses.stream()
                        .sorted(Comparator.comparing(
                                        PlacementDriveSummaryResponse::getEligible,
                                        Comparator.reverseOrder()
                                )
                                .thenComparing(
                                        PlacementDriveSummaryResponse::getSkillMatchPercentage,
                                        Comparator.nullsLast(Comparator.reverseOrder())
                                ))
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

    private List<String> normalizeSkills(List<String> skills) {
        if (skills == null) {
            return List.of();
        }
        Set<String> normalizedSkills = new HashSet<>();
        return skills.stream()
                .map(String::trim)
                .filter(skill -> !skill.isEmpty())
                .filter(skill -> normalizedSkills.add(skill.toLowerCase(Locale.ROOT)))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private void applySkillMatch(
            Student student,
            PlacementDrive drive,
            PlacementDriveSummaryResponse response
    ) {
        List<String> studentSkills = student.getSkills();
        List<String> requiredSkills = drive.getRequiredSkills();
        if (studentSkills == null || studentSkills.isEmpty()) {
            response.setSkillMatchNote("Add skills to your profile to see a match.");
            return;
        }
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            response.setSkillMatchNote("This job does not list skills to compare yet.");
            return;
        }

        Map<String, String> studentSkillsByKey = studentSkills.stream()
                .collect(Collectors.toMap(
                        this::normalizeSkill,
                        Function.identity(),
                        (first, ignored) -> first
                ));
        LinkedHashSet<String> matched = new LinkedHashSet<>();
        LinkedHashSet<String> missing = new LinkedHashSet<>();
        for (String requiredSkill : requiredSkills) {
            String key = normalizeSkill(requiredSkill);
            if (studentSkillsByKey.containsKey(key)) {
                matched.add(requiredSkill);
            } else {
                missing.add(requiredSkill);
            }
        }
        int percentage = Math.round(100.0f * matched.size() / requiredSkills.size());
        response.setSkillMatchPercentage(percentage);
        response.setMatchedSkills(List.copyOf(matched));
        response.setMissingSkills(List.copyOf(missing));
        response.setSkillMatchNote(matched.isEmpty()
                ? "No required skills were found in your profile."
                : "Your profile includes " + matched.size() + " of "
                        + requiredSkills.size() + " listed skills.");
    }

    private String normalizeSkill(String skill) {
        return skill.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9+#.]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private void validateJobDescriptionFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A job description file is required.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Maximum allowed file size is 5 MB.");
        }
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new IllegalArgumentException("A filename is required.");
        }
        String lowerCaseFileName = fileName.toLowerCase(Locale.ROOT);
        if (!lowerCaseFileName.endsWith(".pdf") && !lowerCaseFileName.endsWith(".docx")) {
            throw new IllegalArgumentException("Only PDF and DOCX files are supported.");
        }
    }

    private void validateJobDescriptionFileContents(String fileName, byte[] fileBytes) {
        if (fileName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            if (fileBytes.length < 5
                    || !new String(fileBytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII)
                            .equals("%PDF-")) {
                throw new IllegalArgumentException("The uploaded PDF file is invalid.");
            }
            return;
        }

        if (fileBytes.length < 4
                || fileBytes[0] != 0x50
                || fileBytes[1] != 0x4b
                || fileBytes[2] != 0x03
                || fileBytes[3] != 0x04) {
            throw new IllegalArgumentException("The uploaded DOCX file is invalid.");
        }
    }

    private String sanitizeFileName(String fileName) {
        String normalized = fileName.replace('\\', '/');
        return normalized.substring(normalized.lastIndexOf('/') + 1);
    }

    private PlacementDrive getPlacementDriveForCurrentUser(Long driveId) {
        User user = getAuthenticatedUser();
        return switch (user.getRole()) {
            case STUDENT -> placementDriveRepository.findByIdAndStatus(driveId, DriveStatus.OPEN)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Placement drive not found."));
            case RECRUITER -> {
                Recruiter recruiter = getAuthenticatedRecruiter();
                yield getOwnedPlacementDrive(driveId, recruiter.getCompany().getId());
            }
            case PLACEMENT_ADMIN -> placementDriveRepository
                    .findByIdAndStatusNot(driveId, DriveStatus.DRAFT)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Placement drive not found."));
            default -> throw new InvalidRequestException(
                    "You are not allowed to view this job description document."
            );
        };
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