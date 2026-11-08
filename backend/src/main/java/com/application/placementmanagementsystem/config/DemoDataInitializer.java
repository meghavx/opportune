package com.application.placementmanagementsystem.config;

import com.application.placementmanagementsystem.models.Application;
import com.application.placementmanagementsystem.models.Company;
import com.application.placementmanagementsystem.models.EligibilityCriteria;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.PlacementDriveJdDocument;
import com.application.placementmanagementsystem.models.Recruiter;
import com.application.placementmanagementsystem.models.RecruitmentActivity;
import com.application.placementmanagementsystem.models.Resume;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.User;
import com.application.placementmanagementsystem.models.enums.ActivityMode;
import com.application.placementmanagementsystem.models.enums.ApplicationStatus;
import com.application.placementmanagementsystem.models.enums.Department;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import com.application.placementmanagementsystem.models.enums.RecruitmentActivityType;
import com.application.placementmanagementsystem.models.enums.RoleType;
import com.application.placementmanagementsystem.repositories.ApplicationRepository;
import com.application.placementmanagementsystem.repositories.CompanyRepository;
import com.application.placementmanagementsystem.repositories.EligibilityCriteriaRepository;
import com.application.placementmanagementsystem.repositories.PlacementDriveRepository;
import com.application.placementmanagementsystem.repositories.PlacementDriveJdDocumentRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

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
    private final PlacementDriveJdDocumentRepository placementDriveJdDocumentRepository;
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

        findOrCreateUser(
            "demo.admin@opportune.local",
            "Demo Placement Admin",
            RoleType.PLACEMENT_ADMIN
        );

        seedStudents();
        seedRecruiters();
        seedResumes();
        seedDrives();
        seedDriveJobDescriptionDocuments();
        seedApplications();
        seedRecruitmentActivities();

        userRepository.flush();
    }

    private void seedStudents() {
        int graduationYear = Year.now().getValue() + 1;
        List.of(
            new StudentSeed(
                "demo.student1@opportune.local", "Ananya Iyer", "DEMO-001", Department.CSE, "9.10", 0
            ),
            new StudentSeed(
                "demo.student2@opportune.local", "Sharanya Patel", "DEMO-002", Department.IT, "8.40", 0
            ),
            new StudentSeed(
                "demo.student3@opportune.local", "Sana Khan", "DEMO-003", Department.ECE, "7.60", 1
            ),
            new StudentSeed(
                "demo.student4@opportune.local", "Vikram Joshi", "DEMO-004", Department.MECHANICAL, "6.80", 2
            ),
            new StudentSeed(
                "demo.student5@opportune.local", "Priya Nair", "DEMO-005", Department.CSE, "7.90", 0
            ),
            new StudentSeed(
                "demo.student6@opportune.local", "Manan Bose", "DEMO-006", Department.CIVIL, "8.20", 0
            ),
            new StudentSeed(
                "demo.student7@opportune.local", "Meera Desai", "DEMO-007", Department.IT, "6.40", 1
            ),
            new StudentSeed(
                "demo.student8@opportune.local", "Raman Singh", "DEMO-008", Department.ECE, "8.90", 0
            )
        ).forEach(seed -> seedStudent(seed, graduationYear));
    }

    private void seedStudent(StudentSeed seed, int graduationYear) {
        User studentUser = findOrCreateUser(seed.email(), seed.fullName(), RoleType.STUDENT);

        studentRepository.findByRollNumber(seed.rollNumber()).ifPresent(existing -> {
            if (!existing.getUser().getId().equals(studentUser.getId())) {
                throw new IllegalStateException(
                    "Demo roll number " + seed.rollNumber() + " is already assigned to a different user."
                );
            }
        });

        studentRepository.findByUser(studentUser).ifPresentOrElse(
            existing -> {
                if (!existing.getRollNumber().equals(seed.rollNumber())) {
                    throw new IllegalStateException(
                        "Demo student " + seed.email() + " already has a different roll number."
                    );
                }
            },
            () -> studentRepository.save(Student.builder()
                .user(studentUser)
                .rollNumber(seed.rollNumber())
                .department(seed.department())
                .graduationYear(graduationYear)
                .cgpa(new BigDecimal(seed.cgpa()))
                .currentBacklogs(seed.backlogs())
                .build())
        );
    }

    private void seedRecruiters() {
        List.of(
            new RecruiterSeed(
                "Northstar Analytics", "Kanan Singh", "kanan@northstar-demo.local", "Technical Recruiter"
            ),
            new RecruiterSeed(
                "BluePeak Systems", "Mira Shah", "mira@bluepeak-demo.local", "Talent Acquisition Lead"
            ),
            new RecruiterSeed(
                "Cedar Labs", "Dev Patel", "dev@cedarlabs-demo.local", "University Recruiter"
            ),
            new RecruiterSeed(
                "Meridian Robotics", "Isha Rao", "isha@meridian-demo.local", "Recruitment Manager"
            ),
            new RecruiterSeed(
                "Harbor Digital", "Mohan Das", "mohan@harbor-demo.local", "Technical Recruiter"
            )
        ).forEach(this::seedRecruiter);
    }

    private void seedRecruiter(RecruiterSeed seed) {
        Company company = companyRepository.findByCompanyNameIgnoreCase(seed.companyName())
            .orElseGet(() -> companyRepository.save(Company.builder()
                .companyName(seed.companyName())
                .website("https://www." + seed.companyName()
                    .toLowerCase().replace(" ", "") + ".example")
                .location("Bengaluru, India")
                .description("Fictional company seeded for local demo use.")
                .industry("Technology")
                .active(true)
                .build()));

        User recruiterUser = findOrCreateUser(
            seed.email(),
            seed.name(),
            RoleType.RECRUITER
        );

        recruiterRepository.findByUser(recruiterUser).ifPresentOrElse(
            existing -> {
                if (!existing.getCompany().getId().equals(company.getId())) {
                    throw new IllegalStateException(
                        "Demo recruiter " + seed.email()
                            + " is already linked to a different company."
                    );
                }
            },
            () -> recruiterRepository.save(Recruiter.builder()
                .user(recruiterUser)
                .company(company)
                .designation(seed.designation())
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

            String safeName = student.getUser().getFullName()
                .replaceAll("[^A-Za-z0-9]+", "_");

            boolean needsSeededSkills = student.getSkills() == null || student.getSkills().isEmpty();
            List<String> skills = needsSeededSkills ? getDemoSkills(student) : student.getSkills();
            if (needsSeededSkills) {
                student.setSkills(new ArrayList<>(skills));
                studentRepository.save(student);
            }

            String seededResumeName = safeName + "_Resume.pdf";
            Resume resume = resumeRepository.findByStudent(student).orElse(null);
            if (resume == null) {
                resume = Resume.builder()
                    .student(student)
                    .fileName(seededResumeName)
                    .build();
            }
            if (seededResumeName.equals(resume.getFileName()) || resume.getFile() == null) {
                resume.setFile(createDemoResumePdf(student, skills));
                resumeRepository.save(resume);
            }
        }
    }

    private byte[] createDemoResumePdf(Student student, List<String> skills) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document();

        try {
            PdfWriter.getInstance(document, output);
            document.open();
            addParagraphs(
                document,
                "RESUME",
                "",
                "Name: " + student.getUser().getFullName(),
                "Email: " + student.getUser().getEmail(),
                "Roll number: " + student.getRollNumber(),
                "Department: " + student.getDepartment(),
                "Graduation year: " + student.getGraduationYear(),
                "CGPA: " + student.getCgpa(),
                "",
                "Academic Interests",
                getAcademicInterests(student.getDepartment()),
                "",
                "Technical Skills",
                String.join(", ", skills),
                "",
                "Projects",
                getDemoProject(student.getDepartment())
            );
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

    private List<String> getDemoSkills(Student student) {
        return switch (student.getRollNumber()) {
            case "DEMO-001" -> List.of("Java", "Spring Boot", "SQL", "REST APIs", "Git", "Python");
            case "DEMO-002" -> List.of("JavaScript", "React", "HTML", "CSS", "SQL", "AWS");
            case "DEMO-003" -> List.of("C", "C++", "Embedded C", "Microcontrollers", "IoT", "Python");
            case "DEMO-004" -> List.of("AutoCAD", "SolidWorks", "CAD", "Manufacturing", "MATLAB");
            case "DEMO-005" -> List.of("Python", "SQL", "Data Analysis", "Power BI", "Java");
            case "DEMO-006" -> List.of("AutoCAD", "Revit", "Structural Analysis", "Project Planning");
            case "DEMO-007" -> List.of("Java", "HTML", "CSS", "Software Testing", "Selenium");
            case "DEMO-008" -> List.of("C++", "Embedded C", "PCB Design", "IoT", "MATLAB");
            default -> List.of();
        };
    }

    private String getDemoProject(Department department) {
        return switch (department) {
            case CSE -> "Built a REST API with Java, Spring Boot, and SQL for a campus service.";
            case IT -> "Developed a responsive React application and deployed it to AWS.";
            case ECE -> "Created a sensor-based IoT prototype using embedded C and a microcontroller.";
            case MECHANICAL -> "Designed and analyzed a mechanical assembly using CAD tools.";
            case CIVIL -> "Prepared a structural model and project plan for a small building.";
            case CHEMICAL -> "Modeled a process workflow and documented safety requirements.";
            case BIOTECHNOLOGY -> "Analyzed a sample dataset using Python and bioinformatics tools.";
            case OTHER -> "Collaborated on a software prototype and documented the project.";
        };
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
        demoDriveSeeds().forEach(this::seedDrive);
    }

    private void seedDriveJobDescriptionDocuments() {
        for (DriveSeed seed : demoDriveSeeds()) {
            if (seed.status() != DriveStatus.OPEN) continue;

            PlacementDrive drive = findDemoDrive(seed.companyName(), seed.jobRole());
            String fileName = seed.jobRole().replaceAll("[^A-Za-z0-9]+", "_")
                    + "_Job_Description.pdf";
            if (drive.getJobDescriptionFileName() != null
                    && !fileName.equals(drive.getJobDescriptionFileName())) continue;

            EligibilityCriteria criteria = eligibilityCriteriaRepository
                .findByPlacementDriveId(drive.getId())
                .orElseThrow(() -> new IllegalStateException(
                    "Demo drive eligibility criteria not found: " + drive.getJobRole()
                ));
            PlacementDriveJdDocument document = placementDriveJdDocumentRepository
                .findById(drive.getId())
                .orElseGet(() -> PlacementDriveJdDocument.builder()
                    .placementDrive(drive)
                    .build());
            document.setFile(createDemoJobDescriptionPdf(drive, criteria));
            placementDriveJdDocumentRepository.save(document);
            drive.setJobDescriptionFileName(fileName);
            placementDriveRepository.save(drive);
        }
    }

    private List<DriveSeed> demoDriveSeeds() {
        LocalDate today = LocalDate.now();
        int graduationYear = Year.now().getValue() + 1;
        return List.of(
            new DriveSeed(
                "Northstar Analytics", "Data Analyst",
                "Analyze product and business data to support decision-making.",
                "12.00", DriveStatus.COMPLETED, today.minusMonths(3), today.minusMonths(2),
                "7.00", null, 2, graduationYear
            ),
            new DriveSeed(
                "BluePeak Systems", "Software Engineer",
                "Draft demo drive for an entry-level software engineering role.",
                "10.00", DriveStatus.DRAFT, today.plusDays(90), today.plusDays(110),
                "7.50", Department.CSE, 0, graduationYear
            ),
            new DriveSeed(
                "Cedar Labs", "Backend Developer",
                "Build and maintain backend services and APIs.",
                "14.00", DriveStatus.OPEN, today.plusDays(30), today.plusDays(45),
                "7.00", Department.CSE, 2, graduationYear
            ),
            new DriveSeed(
                "Meridian Robotics", "Embedded Systems Engineer",
                "Develop software for robotics and embedded platforms.",
                "11.00", DriveStatus.OPEN, today.plusDays(35), today.plusDays(50),
                "7.00", Department.ECE, 2, graduationYear
            ),
            new DriveSeed(
                "Harbor Digital", "Associate Software Engineer",
                "Contribute to web application development across product teams.",
                "8.50", DriveStatus.OPEN, today.plusDays(40), today.plusDays(55),
                "6.00", null, 2, graduationYear
            ),
            new DriveSeed(
                "Northstar Analytics", "Business Intelligence Associate",
                "Prepare reports and dashboards from business datasets.",
                "9.00", DriveStatus.OPEN, today.plusDays(45), today.plusDays(60),
                "6.00", null, 2, graduationYear
            )
        );
    }

    private byte[] createDemoJobDescriptionPdf(
            PlacementDrive drive,
            EligibilityCriteria criteria
    ) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, output);
            document.open();
            addParagraphs(
                document,
                "JOB DESCRIPTION",
                drive.getCompany().getCompanyName(),
                drive.getJobRole(),
                "",
                "Role Overview",
                drive.getJobDescription(),
                "",
                "Required Skills",
                String.join(", ", drive.getRequiredSkills()),
                "",
                "Eligibility Criteria",
                "Minimum CGPA: " + criteria.getMinCgpa(),
                "Eligible departments: " + (criteria.getDepartment() == null
                    ? "All departments"
                    : criteria.getDepartment()),
                "Maximum active backlogs: " + criteria.getMaxBacklogs(),
                "Graduation year: " + criteria.getGraduationYear()
            );
            document.close();
            return output.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException(
                "Unable to generate demo job description for drive " + drive.getId(),
                exception
            );
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
    }

    private void addParagraphs(Document document, String... lines) throws DocumentException {
        for (String line : lines) {
            document.add(new Paragraph(line));
        }
    }

    private void seedDrive(DriveSeed seed) {
        Company company = companyRepository.findByCompanyNameIgnoreCase(seed.companyName())
            .orElseThrow(() -> new IllegalStateException(
                "Demo company not found: " + seed.companyName()
            ));

        PlacementDrive drive = placementDriveRepository
            .findByCompanyAndJobRoleIgnoreCase(company, seed.jobRole())
            .orElseGet(() -> placementDriveRepository.save(PlacementDrive.builder()
                .company(company)
                .jobRole(seed.jobRole())
                .jobDescription(seed.jobDescription())
                .requiredSkills(new ArrayList<>(getDemoRequiredSkills(seed.jobRole())))
                .packageOffered(new BigDecimal(seed.packageOffered()))
                .location(company.getLocation())
                .applicationDeadline(seed.applicationDeadline())
                .driveDate(seed.driveDate())
                .status(seed.status())
                .build())
            );

        if (drive.getRequiredSkills() == null || drive.getRequiredSkills().isEmpty()) {
            drive.setRequiredSkills(new ArrayList<>(getDemoRequiredSkills(seed.jobRole())));
            placementDriveRepository.save(drive);
        }

        EligibilityCriteria criteria = eligibilityCriteriaRepository
            .findByPlacementDriveId(drive.getId())
            .orElseGet(() -> EligibilityCriteria.builder()
                .placementDrive(drive)
                .build());

        criteria.setMinCgpa(new BigDecimal(seed.minCgpa()));
        criteria.setDepartment(seed.department());
        criteria.setMaxBacklogs(seed.maxBacklogs());
        criteria.setGraduationYear(seed.graduationYear());
        criteria.setPlacementDrive(drive);
        drive.setEligibilityCriteria(criteria);
        eligibilityCriteriaRepository.save(criteria);
    }

    private List<String> getDemoRequiredSkills(String jobRole) {
        return switch (jobRole) {
            case "Data Analyst", "Business Intelligence Associate" ->
                List.of("SQL", "Python", "Data Analysis", "Power BI");
            case "Software Engineer" ->
                List.of("Java", "Spring Boot", "SQL", "REST APIs", "Git");
            case "Backend Developer" ->
                List.of("Java", "Spring Boot", "SQL", "REST APIs", "Git");
            case "Embedded Systems Engineer" ->
                List.of("C", "Embedded C", "Microcontrollers", "C++");
            case "Associate Software Engineer" ->
                List.of("JavaScript", "React", "HTML", "CSS", "Git");
            default -> List.of();
        };
    }

    private void seedApplications() {
        List.of(
            new ApplicationSeed("DEMO-001", "Northstar Analytics", "Data Analyst", ApplicationStatus.SELECTED),
            new ApplicationSeed("DEMO-003", "Northstar Analytics", "Data Analyst", ApplicationStatus.REJECTED),
            new ApplicationSeed("DEMO-001", "Cedar Labs", "Backend Developer", ApplicationStatus.APPLIED),
            new ApplicationSeed("DEMO-005", "Cedar Labs", "Backend Developer", ApplicationStatus.SHORTLISTED),
            new ApplicationSeed("DEMO-003", "Meridian Robotics", "Embedded Systems Engineer",
                    ApplicationStatus.INTERVIEW_SCHEDULED)
        ).forEach(this::seedApplication);
    }

    private void seedApplication(ApplicationSeed seed) {
        Student student = studentRepository.findByRollNumber(seed.rollNumber())
            .orElseThrow(() -> new IllegalStateException(
                "Demo student not found: " + seed.rollNumber()
            ));

        PlacementDrive drive = findDemoDrive(seed.companyName(), seed.jobRole());

        if (!applicationRepository.existsByStudentAndPlacementDrive(student, drive)) {
            applicationRepository.save(Application.builder()
                .student(student)
                .placementDrive(drive)
                .status(seed.status())
                .build());
        }
    }

    private void seedRecruitmentActivities() {
        LocalDate today = LocalDate.now();
        List.of(
            new ActivitySeed("Northstar Analytics", "Data Analyst",
                    RecruitmentActivityType.APTITUDE_TEST, "Demo aptitude test",
                    today.minusMonths(2).minusDays(14).atTime(10, 0),
                    ActivityMode.OFFLINE, "Northstar Analytics, Bengaluru", null),
            new ActivitySeed("Northstar Analytics", "Data Analyst",
                    RecruitmentActivityType.TECHNICAL_INTERVIEW, "Demo technical interview",
                    today.minusMonths(2).minusDays(7).atTime(14, 0),
                    ActivityMode.ONLINE, null, "https://example.com/demo-northstar-interview"),
            new ActivitySeed("Cedar Labs", "Backend Developer",
                    RecruitmentActivityType.CODING_TEST, "Demo coding test",
                    today.plusDays(7).atTime(10, 0),
                    ActivityMode.ONLINE, null, "https://example.com/demo-cedar-coding-test"),
            new ActivitySeed("Meridian Robotics", "Embedded Systems Engineer",
                    RecruitmentActivityType.TECHNICAL_INTERVIEW, "Demo technical interview",
                    today.plusDays(10).atTime(11, 0),
                    ActivityMode.ONLINE, null, "https://example.com/demo-meridian-interview"),
            new ActivitySeed("Meridian Robotics", "Embedded Systems Engineer",
                    RecruitmentActivityType.HR_INTERVIEW, "Demo HR interview",
                    today.plusDays(12).atTime(11, 0),
                    ActivityMode.OFFLINE, "Meridian Robotics, Bengaluru", null)
        ).forEach(this::seedActivity);
    }

    private void seedActivity(ActivitySeed seed) {
        PlacementDrive drive = findDemoDrive(seed.companyName(), seed.jobRole());

        if (!recruitmentActivityRepository.existsByPlacementDriveAndTitleIgnoreCase(drive, seed.title())) {
            recruitmentActivityRepository.save(RecruitmentActivity.builder()
                .placementDrive(drive)
                .activityType(seed.type())
                .title(seed.title())
                .scheduledAt(seed.scheduledAt())
                .mode(seed.mode())
                .venue(seed.venue())
                .meetingLink(seed.meetingLink())
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

    private record StudentSeed(
            String email,
            String fullName,
            String rollNumber,
            Department department,
            String cgpa,
            int backlogs
    ) {}

    private record RecruiterSeed(
            String companyName,
            String name,
            String email,
            String designation
    ) {}

    private record DriveSeed(
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
    ) {}

    private record ApplicationSeed(
            String rollNumber,
            String companyName,
            String jobRole,
            ApplicationStatus status
    ) {}

    private record ActivitySeed(
            String companyName,
            String jobRole,
            RecruitmentActivityType type,
            String title,
            LocalDateTime scheduledAt,
            ActivityMode mode,
            String venue,
            String meetingLink
    ) {}
}