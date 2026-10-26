package com.application.placementmanagementsystem.config;

import com.application.placementmanagementsystem.models.enums.ActivityMode;
import com.application.placementmanagementsystem.models.Application;
import com.application.placementmanagementsystem.models.enums.ApplicationStatus;
import com.application.placementmanagementsystem.models.Company;
import com.application.placementmanagementsystem.models.EligibilityCriteria;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.Recruiter;
import com.application.placementmanagementsystem.models.RecruitmentActivity;
import com.application.placementmanagementsystem.models.Resume;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.User;
import com.application.placementmanagementsystem.models.enums.Department;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import com.application.placementmanagementsystem.models.enums.RecruitmentActivityType;
import com.application.placementmanagementsystem.models.enums.RoleType;
import com.application.placementmanagementsystem.repositories.ApplicationRepository;
import com.application.placementmanagementsystem.repositories.CompanyRepository;
import com.application.placementmanagementsystem.repositories.EligibilityCriteriaRepository;
import com.application.placementmanagementsystem.repositories.PlacementDriveRepository;
import com.application.placementmanagementsystem.repositories.RecruiterRepository;
import com.application.placementmanagementsystem.repositories.RecruitmentActivityRepository;
import com.application.placementmanagementsystem.repositories.ResumeRepository;
import com.application.placementmanagementsystem.repositories.StudentRepository;
import com.application.placementmanagementsystem.repositories.UserRepository;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;

@Component
@Profile("demo")
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final ResumeRepository resumeRepository;
    private final CompanyRepository companyRepository;
    private final RecruiterRepository recruiterRepository;
    private final PlacementDriveRepository placementDriveRepository;
    private final EligibilityCriteriaRepository eligibilityCriteriaRepository;
    private final ApplicationRepository applicationRepository;
    private final RecruitmentActivityRepository recruitmentActivityRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.password}")
    private String demoPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (demoPassword == null || demoPassword.isBlank()) {
            throw new IllegalStateException(
                    "DEMO_USER_PASSWORD must be set when the demo profile is active."
            );
        }

        User placementAdmin = findOrCreateUser(
            "demo.admin@opportune.local",
            "Demo Placement Admin",
            RoleType.PLACEMENT_ADMIN
        );

        seedStudents();
        seedRecruiters();
        seedResumes();
        seedDrives();
        seedApplications();
        seedRecruitmentActivities();

        userRepository.flush();
    }

    private void seedStudents() {
        int graduationYear = Year.now().getValue() + 1;

        seedStudent(
            "demo.student1@opportune.local", 
            "Ananya Iyer",
            "DEMO-001", 
            Department.CSE, 
            graduationYear, 
            "9.10", 
            0
        );
        seedStudent(
            "demo.student2@opportune.local", 
            "Sharanya Patel",
            "DEMO-002", 
            Department.IT, graduationYear,
            "8.40", 
            0
        );
        seedStudent(
            "demo.student3@opportune.local", 
            "Sana Khan",
            "DEMO-003", 
            Department.ECE, 
            graduationYear, 
            "7.60", 
            1
        );
        seedStudent(
            "demo.student4@opportune.local", 
            "Vikram Joshi",
            "DEMO-004", 
            Department.MECHANICAL, 
            graduationYear, 
            "6.80", 
            2
        );
        seedStudent(
            "demo.student5@opportune.local", 
            "Priya Nair",
            "DEMO-005", 
            Department.CSE, 
            graduationYear, 
            "7.90", 
            0
        );
        seedStudent(
            "demo.student6@opportune.local", 
            "Manan Bose",
            "DEMO-006", 
            Department.CIVIL, 
            graduationYear, 
            "8.20", 
            0
        );
        seedStudent(
            "demo.student7@opportune.local", 
            "Meera Desai",
            "DEMO-007", 
            Department.IT, 
            graduationYear, 
            "6.40", 
            1
        );
        seedStudent(
            "demo.student8@opportune.local", 
            "Raman Singh",
            "DEMO-008", 
            Department.ECE, 
            graduationYear, 
            "8.90", 
            0
        );
    }

    private void seedStudent(
            String email,
            String fullName,
            String rollNumber,
            Department department,
            int graduationYear,
            String cgpa,
            int backlogs
    ) {
        User studentUser = findOrCreateUser(email, fullName, RoleType.STUDENT);

        studentRepository.findByRollNumber(rollNumber).ifPresent(existing -> {
            if (!existing.getUser().getId().equals(studentUser.getId())) {
                throw new IllegalStateException(
                    "Demo roll number " + rollNumber + " is already assigned to a different user."
                );
            }
        });

        studentRepository.findByUser(studentUser).ifPresentOrElse(
                existing -> {
                    if (!existing.getRollNumber().equals(rollNumber)) {
                        throw new IllegalStateException(
                            "Demo student " + email + " already has a different roll number."
                        );
                    }
                },
                () -> studentRepository.save(Student.builder()
                        .user(studentUser)
                        .rollNumber(rollNumber)
                        .department(department)
                        .graduationYear(graduationYear)
                        .cgpa(new BigDecimal(cgpa))
                        .currentBacklogs(backlogs)
                        .build())
        );
    }

    private void seedRecruiters() {
        seedRecruiter(
            "Northstar Analytics",
            "Northstar Analytics",
            "Kanan Singh",
            "kanan@northstar-demo.local",
            "Technical Recruiter"
        );
        seedRecruiter(
            "BluePeak Systems",
            "BluePeak Systems",
            "Mira Shah",
            "mira@bluepeak-demo.local",
            "Talent Acquisition Lead"
        );
        seedRecruiter(
            "Cedar Labs",
            "Cedar Labs",
            "Dev Patel",
            "dev@cedarlabs-demo.local",
            "University Recruiter"
        );
        seedRecruiter(
            "Meridian Robotics",
            "Meridian Robotics",
            "Isha Rao",
            "isha@meridian-demo.local",
            "Recruitment Manager"
        );
        seedRecruiter(
            "Harbor Digital",
            "Harbor Digital",
            "Mohan Das",
            "mohan@harbor-demo.local",
            "Technical Recruiter"
        );
    }

    private void seedRecruiter(
        String companyName,
        String companyWebsiteName,
        String recruiterName,
        String recruiterEmail,
        String designation
    ) {
        Company company = companyRepository.findByCompanyNameIgnoreCase(companyName)
            .orElseGet(() -> companyRepository.save(Company.builder()
                .companyName(companyName)
                .website("https://www." + companyWebsiteName
                    .toLowerCase().replace(" ", "") + ".example")
                .location("Bengaluru, India")
                .description("Fictional company seeded for local demo use.")
                .industry("Technology")
                .active(true)
                .build()));

        User recruiterUser = findOrCreateUser(
            recruiterEmail,
            recruiterName,
            RoleType.RECRUITER
        );

        recruiterRepository.findByUser(recruiterUser).ifPresentOrElse(
            existing -> {
                if (!existing.getCompany().getId().equals(company.getId())) {
                    throw new IllegalStateException(
                        "Demo recruiter " + recruiterEmail
                            + " is already linked to a different company."
                    );
                }
            },
            () -> recruiterRepository.save(Recruiter.builder()
                .user(recruiterUser)
                .company(company)
                .designation(designation)
                .build())
        );
    }

    private void seedResumes() {
        for (int i = 1; i <= 8; i++) {
            String rollNumber = "DEMO-%03d".formatted(i);

            Student student = studentRepository.findByRollNumber(rollNumber)
                .orElseThrow(() -> new IllegalStateException(
                    "Demo student not found: " + rollNumber
                ));

            if (resumeRepository.existsByStudent(student)) {
                continue;
            }

            String safeName = student.getUser().getFullName()
                .replaceAll("[^A-Za-z0-9]+", "_");

            resumeRepository.save(Resume.builder()
                .student(student)
                .fileName(safeName + "_Resume.pdf")
                .file(createDemoResumePdf(student))
                .build());
        }
    }

    private byte[] createDemoResumePdf(Student student) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document();

        try {
            PdfWriter.getInstance(document, output);
            document.open();

            document.add(new Paragraph("RESUME"));
            document.add(new Paragraph(""));
            document.add(new Paragraph("Name: " + student.getUser().getFullName()));
            document.add(new Paragraph("Email: " + student.getUser().getEmail()));
            document.add(new Paragraph("Roll number: " + student.getRollNumber()));
            document.add(new Paragraph("Department: " + student.getDepartment()));
            document.add(new Paragraph("Graduation year: " + student.getGraduationYear()));
            document.add(new Paragraph("CGPA: " + student.getCgpa()));
            document.add(new Paragraph(""));
            document.add(new Paragraph("Academic Interests"));
            document.add(new Paragraph(getAcademicInterests(student.getDepartment())));

            document.close();
            return output.toByteArray();

        } catch (DocumentException e) {
            throw new IllegalStateException(
                "Unable to generate demo resume for " + student.getRollNumber(),
                e
            );
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
    }

    private String getAcademicInterests(Department department) {
        return switch (department) {
            case CSE -> "Software engineering, data structures, databases, and backend development.";
            case IT -> "Web development, cloud fundamentals, API integration, and software testing.";
            case ECE -> "Embedded systems, digital electronics, communication systems, and IoT.";
            case MECHANICAL -> "Product design, manufacturing systems, CAD, and automation.";
            case CIVIL -> "Structural engineering, construction planning, surveying, and sustainable design.";
            case CHEMICAL -> "Process engineering, thermodynamics, materials, and process safety.";
            case BIOTECHNOLOGY -> "Molecular biology, bioinformatics, laboratory methods, and bioprocessing.";
            case OTHER -> "Technology, problem-solving, and collaborative project work.";
        };
    }

    private void seedDrives() {
        int graduationYear = Year.now().getValue() + 1;
        LocalDate today = LocalDate.now();

        seedDrive(
            "Northstar Analytics",
            "Data Analyst",
            "Analyze product and business data to support decision-making.",
            "12.00",
            DriveStatus.COMPLETED,
            today.minusMonths(3),
            today.minusMonths(2),
            "7.00",
            null,
            2,
            graduationYear
        );

        seedDrive(
            "BluePeak Systems",
            "Software Engineer",
            "Draft demo drive for an entry-level software engineering role.",
            "10.00",
            DriveStatus.DRAFT,
            today.plusDays(90),
            today.plusDays(110),
            "7.50",
            Department.CSE,
            0,
            graduationYear
        );

        seedDrive(
            "Cedar Labs",
            "Backend Developer",
            "Build and maintain backend services and APIs.",
            "14.00",
            DriveStatus.OPEN,
            today.plusDays(30),
            today.plusDays(45),
            "7.00",
            Department.CSE,
            1,
            graduationYear
        );

        seedDrive(
            "Meridian Robotics",
            "Embedded Systems Engineer",
            "Develop software for robotics and embedded platforms.",
            "11.00",
            DriveStatus.OPEN,
            today.plusDays(35),
            today.plusDays(50),
            "7.00",
            Department.ECE,
            1,
            graduationYear
        );

        seedDrive(
            "Harbor Digital",
            "Associate Software Engineer",
            "Contribute to web application development across product teams.",
            "8.50",
            DriveStatus.OPEN,
            today.plusDays(40),
            today.plusDays(55),
            "6.50",
            null,
            2,
            graduationYear
        );

        seedDrive(
            "Northstar Analytics",
            "Business Intelligence Associate",
            "Prepare reports and dashboards from business datasets.",
            "9.00",
            DriveStatus.OPEN,
            today.plusDays(45),
            today.plusDays(60),
            "7.50",
            Department.IT,
            0,
            graduationYear
        );
    }

    private void seedDrive(
        String companyName,
        String jobRole,
        String jobDescription,
        String packageOffered,
        DriveStatus status,
        LocalDate applicationDeadline,
        LocalDate driveDate,
        String minCgpa,
        Department department,
        int maxBacklogs,
        int graduationYear
    ) {
        Company company = companyRepository.findByCompanyNameIgnoreCase(companyName)
            .orElseThrow(() -> new IllegalStateException(
                "Demo company not found: " + companyName
            ));

        PlacementDrive drive = placementDriveRepository
            .findByCompanyAndJobRoleIgnoreCase(company, jobRole)
            .orElseGet(() -> placementDriveRepository.save(PlacementDrive.builder()
                .company(company)
                .jobRole(jobRole)
                .jobDescription(jobDescription)
                .packageOffered(new BigDecimal(packageOffered))
                .location(company.getLocation())
                .applicationDeadline(applicationDeadline)
                .driveDate(driveDate)
                .status(status)
                .build()));

        if (!eligibilityCriteriaRepository.existsByPlacementDriveId(drive.getId())) {
            eligibilityCriteriaRepository.save(EligibilityCriteria.builder()
                .placementDrive(drive)
                .minCgpa(new BigDecimal(minCgpa))
                .department(department)
                .maxBacklogs(maxBacklogs)
                .graduationYear(graduationYear)
                .build());
        }
    }

    private void seedApplications() {
        seedApplication(
            "DEMO-001", 
            "Northstar Analytics", 
            "Data Analyst",
            ApplicationStatus.SELECTED
        );
        seedApplication(
            "DEMO-003", 
            "Northstar Analytics", 
            "Data Analyst",
            ApplicationStatus.REJECTED
        );
        seedApplication(
            "DEMO-001", 
            "Cedar Labs", 
            "Backend Developer",
            ApplicationStatus.APPLIED
        );
        seedApplication(
            "DEMO-005", 
            "Cedar Labs", 
            "Backend Developer",
            ApplicationStatus.SHORTLISTED
        );
        seedApplication(
            "DEMO-003", 
            "Meridian Robotics", 
            "Embedded Systems Engineer",
            ApplicationStatus.INTERVIEW_SCHEDULED
        );
    }

    private void seedApplication(
        String rollNumber,
        String companyName,
        String jobRole,
        ApplicationStatus status
    ) {
        Student student = studentRepository.findByRollNumber(rollNumber)
            .orElseThrow(() -> new IllegalStateException(
                "Demo student not found: " + rollNumber
            ));

        PlacementDrive drive = findDemoDrive(companyName, jobRole);

        if (!applicationRepository.existsByStudentAndPlacementDrive(student, drive)) {
            applicationRepository.save(Application.builder()
                .student(student)
                .placementDrive(drive)
                .status(status)
                .build());
        }
    }

    private void seedRecruitmentActivities() {
        LocalDate today = LocalDate.now();

        seedActivity(
            "Northstar Analytics", "Data Analyst",
            RecruitmentActivityType.APTITUDE_TEST,
            "Demo aptitude test",
            today.minusMonths(2).minusDays(14).atTime(10, 0),
            ActivityMode.OFFLINE,
            "Northstar Analytics, Bengaluru",
            null
        );

        seedActivity(
            "Northstar Analytics", "Data Analyst",
            RecruitmentActivityType.TECHNICAL_INTERVIEW,
            "Demo technical interview",
            today.minusMonths(2).minusDays(7).atTime(14, 0),
            ActivityMode.ONLINE,
            null,
            "https://example.com/demo-northstar-interview"
        );

        seedActivity(
            "Cedar Labs", "Backend Developer",
            RecruitmentActivityType.CODING_TEST,
            "Demo coding test",
            today.plusDays(7).atTime(10, 0),
            ActivityMode.ONLINE,
            null,
            "https://example.com/demo-cedar-coding-test"
        );

        seedActivity(
            "Meridian Robotics", "Embedded Systems Engineer",
            RecruitmentActivityType.TECHNICAL_INTERVIEW,
            "Demo technical interview",
            today.plusDays(10).atTime(11, 0),
            ActivityMode.ONLINE,
            null,
            "https://example.com/demo-meridian-interview"
        );

        seedActivity(
            "Meridian Robotics", "Embedded Systems Engineer",
            RecruitmentActivityType.HR_INTERVIEW,
            "Demo HR interview",
            today.plusDays(12).atTime(11, 0),
            ActivityMode.OFFLINE,
            "Meridian Robotics, Bengaluru",
            null
        );
    }

    private void seedActivity(
        String companyName,
        String jobRole,
        RecruitmentActivityType activityType,
        String title,
        LocalDateTime scheduledAt,
        ActivityMode mode,
        String venue,
        String meetingLink
    ) {
        PlacementDrive drive = findDemoDrive(companyName, jobRole);

        if (!recruitmentActivityRepository.existsByPlacementDriveAndTitleIgnoreCase(drive, title)) {
            recruitmentActivityRepository.save(RecruitmentActivity.builder()
                .placementDrive(drive)
                .activityType(activityType)
                .title(title)
                .scheduledAt(scheduledAt)
                .mode(mode)
                .venue(venue)
                .meetingLink(meetingLink)
                .build());
        }
    }

    private PlacementDrive findDemoDrive(String companyName, String jobRole) {
        Company company = companyRepository.findByCompanyNameIgnoreCase(companyName)
            .orElseThrow(() -> new IllegalStateException(
                "Demo company not found: " + companyName
            ));

        return placementDriveRepository
            .findByCompanyAndJobRoleIgnoreCase(company, jobRole)
            .orElseThrow(() -> new IllegalStateException(
                "Demo drive not found: " + companyName + " - " + jobRole
            ));
    }

    private User findOrCreateUser(String email, String fullName, RoleType role) {
        return userRepository.findByEmail(email).map(existing -> {
            if (existing.getRole() != role) {
                throw new IllegalStateException(
                    "Demo account " + email + " exists with a different role."
                );
            }
            return existing;
        }).orElseGet(() -> userRepository.save(User.builder()
            .email(email)
            .fullName(fullName)
            .password(passwordEncoder.encode(demoPassword))
            .role(role)
            .active(true)
            .build()));
    }
}