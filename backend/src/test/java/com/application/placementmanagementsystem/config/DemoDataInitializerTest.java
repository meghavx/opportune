package com.application.placementmanagementsystem.config;

import com.application.placementmanagementsystem.models.Company;
import com.application.placementmanagementsystem.models.EligibilityCriteria;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.enums.Department;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import com.application.placementmanagementsystem.repositories.ApplicationRepository;
import com.application.placementmanagementsystem.repositories.CompanyRepository;
import com.application.placementmanagementsystem.repositories.EligibilityCriteriaRepository;
import com.application.placementmanagementsystem.repositories.PlacementDriveJdDocumentRepository;
import com.application.placementmanagementsystem.repositories.PlacementDriveRepository;
import com.application.placementmanagementsystem.repositories.RecruiterRepository;
import com.application.placementmanagementsystem.repositories.RecruitmentActivityRepository;
import com.application.placementmanagementsystem.repositories.ResumeRepository;
import com.application.placementmanagementsystem.repositories.StudentRepository;
import com.application.placementmanagementsystem.repositories.UserRepository;
import com.application.placementmanagementsystem.services.eligibility.EligibilityEvaluatorImpl;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DemoDataInitializerTest {

    @Test
    void seededStudentsAreIneligibleForAtMostTwoOpenDemoDrives() {
        CompanyRepository companyRepository = mock(CompanyRepository.class);
        PlacementDriveRepository driveRepository = mock(PlacementDriveRepository.class);
        EligibilityCriteriaRepository criteriaRepository = mock(EligibilityCriteriaRepository.class);
        AtomicLong driveIds = new AtomicLong();
        List<EligibilityCriteria> savedCriteria = new ArrayList<>();

        when(companyRepository.findByCompanyNameIgnoreCase(anyString()))
                .thenAnswer(invocation -> {
                    String name = invocation.getArgument(0);
                    return Optional.of(Company.builder()
                            .id((long) name.hashCode())
                            .companyName(name)
                            .location("Bengaluru, India")
                            .build());
                });
        when(driveRepository.findByCompanyAndJobRoleIgnoreCase(any(), anyString()))
                .thenReturn(Optional.empty());
        when(driveRepository.save(any(PlacementDrive.class)))
                .thenAnswer(invocation -> {
                    PlacementDrive drive = invocation.getArgument(0);
                    drive.setId(driveIds.incrementAndGet());
                    return drive;
                });
        when(criteriaRepository.findByPlacementDriveId(anyLong())).thenReturn(Optional.empty());
        when(criteriaRepository.save(any(EligibilityCriteria.class)))
                .thenAnswer(invocation -> {
                    EligibilityCriteria criteria = invocation.getArgument(0);
                    savedCriteria.add(criteria);
                    return criteria;
                });

        DemoDataInitializer initializer = new DemoDataInitializer(
                mock(UserRepository.class),
                mock(StudentRepository.class),
                mock(ResumeRepository.class),
                companyRepository,
                mock(RecruiterRepository.class),
                driveRepository,
                mock(PlacementDriveJdDocumentRepository.class),
                criteriaRepository,
                mock(ApplicationRepository.class),
                mock(RecruitmentActivityRepository.class),
                mock(PasswordEncoder.class)
        );
        ReflectionTestUtils.invokeMethod(initializer, "seedDrives");

        List<PlacementDrive> openDrives = savedCriteria.stream()
                .map(EligibilityCriteria::getPlacementDrive)
                .filter(drive -> drive.getStatus() == DriveStatus.OPEN)
                .toList();
        List<Student> students = demoStudents();
        EligibilityEvaluatorImpl evaluator = new EligibilityEvaluatorImpl();

        for (Student student : students) {
            long ineligibleCount = openDrives.stream()
                    .filter(drive -> !evaluator.evaluate(student, drive).isEligible())
                    .count();
            assertTrue(
                    ineligibleCount <= 2,
                    () -> student.getRollNumber() + " is ineligible for "
                            + openDrives.stream()
                                    .filter(drive -> !evaluator.evaluate(student, drive).isEligible())
                                    .map(PlacementDrive::getJobRole)
                                    .toList()
            );
        }
    }

    private List<Student> demoStudents() {
        int graduationYear = Year.now().getValue() + 1;
        return List.of(
                student("DEMO-001", Department.CSE, graduationYear, "9.10", 0),
                student("DEMO-002", Department.IT, graduationYear, "8.40", 0),
                student("DEMO-003", Department.ECE, graduationYear, "7.60", 1),
                student("DEMO-004", Department.MECHANICAL, graduationYear, "6.80", 2),
                student("DEMO-005", Department.CSE, graduationYear, "7.90", 0),
                student("DEMO-006", Department.CIVIL, graduationYear, "8.20", 0),
                student("DEMO-007", Department.IT, graduationYear, "6.40", 1),
                student("DEMO-008", Department.ECE, graduationYear, "8.90", 0)
        );
    }

    private Student student(
            String rollNumber,
            Department department,
            int graduationYear,
            String cgpa,
            int backlogs
    ) {
        return Student.builder()
                .rollNumber(rollNumber)
                .department(department)
                .graduationYear(graduationYear)
                .cgpa(new BigDecimal(cgpa))
                .currentBacklogs(backlogs)
                .build();
    }
}
