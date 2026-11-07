package com.application.placementmanagementsystem.services.placementdrive;

import com.application.placementmanagementsystem.auth.CustomUserPrincipal;
import com.application.placementmanagementsystem.dtos.eligibility.EligibilityCriteriaRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveCreateRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveResponse;
import com.application.placementmanagementsystem.mappers.EligibilityCriteriaMapper;
import com.application.placementmanagementsystem.mappers.PlacementDriveMapper;
import com.application.placementmanagementsystem.models.Company;
import com.application.placementmanagementsystem.models.EligibilityCriteria;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.Recruiter;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.User;
import com.application.placementmanagementsystem.models.enums.Department;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import com.application.placementmanagementsystem.models.enums.RoleType;
import com.application.placementmanagementsystem.repositories.EligibilityCriteriaRepository;
import com.application.placementmanagementsystem.repositories.PlacementDriveJdDocumentRepository;
import com.application.placementmanagementsystem.repositories.PlacementDriveRepository;
import com.application.placementmanagementsystem.repositories.RecruiterRepository;
import com.application.placementmanagementsystem.repositories.StudentRepository;
import com.application.placementmanagementsystem.repositories.UserRepository;
import com.application.placementmanagementsystem.services.audit.AuditLogService;
import com.application.placementmanagementsystem.services.eligibility.EligibilityEvaluator;
import com.application.placementmanagementsystem.services.notification.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PlacementDriveServiceImplTest {

    private PlacementDriveRepository placementDriveRepository;
    private EligibilityCriteriaRepository eligibilityCriteriaRepository;
    private PlacementDriveJdDocumentRepository placementDriveJdDocumentRepository;
    private RecruiterRepository recruiterRepository;
    private UserRepository userRepository;
    private StudentRepository studentRepository;
    private EligibilityEvaluator eligibilityEvaluator;
    private AuditLogService auditLogService;
    private PlacementDriveServiceImpl service;

    @BeforeEach
    void setUp() {
        placementDriveRepository = mock(PlacementDriveRepository.class);
        placementDriveJdDocumentRepository = mock(PlacementDriveJdDocumentRepository.class);
        eligibilityCriteriaRepository = mock(EligibilityCriteriaRepository.class);
        recruiterRepository = mock(RecruiterRepository.class);
        userRepository = mock(UserRepository.class);
        studentRepository = mock(StudentRepository.class);
        eligibilityEvaluator = mock(EligibilityEvaluator.class);
        auditLogService = mock(AuditLogService.class);

        service = new PlacementDriveServiceImpl(
                placementDriveRepository,
                placementDriveJdDocumentRepository,
                eligibilityCriteriaRepository,
                recruiterRepository,
                userRepository,
                auditLogService,
                new PlacementDriveMapper(new EligibilityCriteriaMapper()),
                mock(NotificationService.class),
                studentRepository,
                eligibilityEvaluator
        );

        User user = User.builder().id(10L).role(RoleType.RECRUITER).fullName("Recruiter").build();
        Company company = Company.builder().id(20L).companyName("Example Co").build();
        Recruiter recruiter = Recruiter.builder().user(user).company(company).build();
        CustomUserPrincipal principal = new CustomUserPrincipal(
                user.getId(),
                user.getFullName(),
                "recruiter@example.com",
                "",
                RoleType.RECRUITER
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "", principal.getAuthorities())
        );
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(recruiterRepository.findByUser(user)).thenReturn(Optional.of(recruiter));
        when(placementDriveRepository.save(any(PlacementDrive.class)))
                .thenAnswer(invocation -> {
                    PlacementDrive drive = invocation.getArgument(0);
                    drive.setId(30L);
                    return drive;
                });
        when(eligibilityCriteriaRepository.save(any(EligibilityCriteria.class)))
                .thenAnswer(invocation -> {
                    EligibilityCriteria eligibility = invocation.getArgument(0);
                    eligibility.setId(40L);
                    return eligibility;
                });
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createsDriveAndEligibilityInOneTransactionalOperation() throws Exception {
        PlacementDriveCreateRequest driveRequest = PlacementDriveCreateRequest.builder()
                .jobRole("Software Engineer")
                .jobDescription("Build backend services.")
                .packageOffered(new BigDecimal("12"))
                .location("Bengaluru")
                .applicationDeadline(LocalDate.now().plusDays(10))
                .driveDate(LocalDate.now().plusDays(20))
                .build();
        EligibilityCriteriaRequest eligibilityRequest = new EligibilityCriteriaRequest();
        eligibilityRequest.setMinCgpa(new BigDecimal("7.5"));
        eligibilityRequest.setDepartment(Department.CSE);
        eligibilityRequest.setMaxBacklogs(0);
        eligibilityRequest.setGraduationYear(2027);

        PlacementDriveResponse response = service.createPlacementDriveWithEligibility(
                driveRequest,
                eligibilityRequest
        );

        assertEquals(30L, response.getId());
        assertNotNull(response.getEligibility());
        assertEquals(40L, response.getEligibility().getId());
        assertEquals(new BigDecimal("7.5"), response.getEligibility().getMinCgpa());
        assertEquals(Department.CSE, response.getEligibility().getDepartment());
        assertEquals(0, response.getEligibility().getMaxBacklogs());
        assertEquals(2027, response.getEligibility().getGraduationYear());
        assertEquals(DriveStatus.DRAFT, response.getStatus());

        InOrder saveOrder = inOrder(placementDriveRepository, eligibilityCriteriaRepository);
        saveOrder.verify(placementDriveRepository).save(any(PlacementDrive.class));
        saveOrder.verify(eligibilityCriteriaRepository).save(any(EligibilityCriteria.class));
        assertNotNull(
                PlacementDriveServiceImpl.class
                        .getMethod(
                                "createPlacementDriveWithEligibility",
                                PlacementDriveCreateRequest.class,
                                EligibilityCriteriaRequest.class
                        )
                        .getAnnotation(Transactional.class)
        );
    }

    @Test
    void showsSkillMatchesOnlyAfterOptInAndOnlyForEligibleDrives() {
        User studentUser = User.builder().id(11L).role(RoleType.STUDENT).fullName("Student").build();
        Student student = Student.builder()
                .id(12L)
                .user(studentUser)
                .rollNumber("STUDENT-001")
                .department(Department.CSE)
                .graduationYear(2027)
                .cgpa(new BigDecimal("6.0"))
                .currentBacklogs(1)
                .skills(java.util.List.of("JAVA", "SQL"))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new CustomUserPrincipal(
                                studentUser.getId(),
                                studentUser.getFullName(),
                                "student@example.com",
                                "",
                                RoleType.STUDENT
                        ),
                        "",
                        java.util.List.of()
                )
        );
        when(userRepository.findById(studentUser.getId())).thenReturn(Optional.of(studentUser));
        when(studentRepository.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(eligibilityEvaluator.evaluate(any(Student.class), any(PlacementDrive.class)))
                .thenAnswer(invocation -> {
                    PlacementDrive drive = invocation.getArgument(1);
                    boolean eligible = drive.getId().equals(51L);
                    return com.application.placementmanagementsystem.dtos.eligibility
                            .EligibilityEvaluationResult.builder()
                            .eligible(eligible)
                            .ineligibilityReasons(eligible
                                    ? java.util.List.of()
                                    : java.util.List.of("CGPA is below the drive minimum."))
                            .build();
                });

        Company company = Company.builder().id(20L).companyName("Example Co").build();
        PlacementDrive partialMatch = PlacementDrive.builder()
                .id(50L)
                .company(company)
                .jobRole("Backend Engineer")
                .packageOffered(new BigDecimal("12"))
                .location("Bengaluru")
                .driveDate(LocalDate.now().plusDays(20))
                .status(DriveStatus.OPEN)
                .requiredSkills(java.util.List.of("Java", "Spring Boot", "SQL"))
                .build();
        PlacementDrive strongestMatch = PlacementDrive.builder()
                .id(51L)
                .company(company)
                .jobRole("Data Engineer")
                .packageOffered(new BigDecimal("14"))
                .location("Bengaluru")
                .driveDate(LocalDate.now().plusDays(25))
                .status(DriveStatus.OPEN)
                .requiredSkills(java.util.List.of("SQL"))
                .build();
        when(placementDriveRepository.findByStatus(DriveStatus.OPEN))
                .thenReturn(java.util.List.of(partialMatch, strongestMatch));

        var defaultDrives = service.getPlacementDrives(false);
        assertEquals(50L, defaultDrives.getFirst().getId());
        assertNull(defaultDrives.getFirst().getSkillMatchPercentage());
        assertNull(defaultDrives.getLast().getSkillMatchPercentage());

        var matches = service.getPlacementDrives(true);
        assertEquals(51L, matches.getFirst().getId());
        assertEquals(100, matches.getFirst().getSkillMatchPercentage());
        var partial = matches.get(1);
        assertNull(partial.getSkillMatchPercentage());
        assertNull(partial.getMatchedSkills());
        assertNull(partial.getMissingSkills());
        assertEquals(false, partial.getEligible());
        assertEquals(
                java.util.List.of("CGPA is below the drive minimum."),
                partial.getIneligibilityReasons()
        );
    }

    @Test
    void storesOptionalJobDescriptionDocumentForOwnedDraft() {
        Company company = Company.builder().id(20L).companyName("Example Co").build();
        PlacementDrive drive = PlacementDrive.builder()
                .id(30L)
                .company(company)
                .jobRole("Backend Engineer")
                .status(DriveStatus.DRAFT)
                .build();
        when(placementDriveRepository.findByIdAndCompanyId(30L, 20L))
                .thenReturn(Optional.of(drive));
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "backend-role.pdf",
                "application/pdf",
                "%PDF-demo".getBytes()
        );

        String fileName = service.uploadJobDescriptionDocument(30L, file);

        assertEquals("backend-role.pdf", fileName);
        assertEquals("backend-role.pdf", drive.getJobDescriptionFileName());
        verify(placementDriveJdDocumentRepository).save(any());
        verify(placementDriveRepository).save(drive);
    }
}
