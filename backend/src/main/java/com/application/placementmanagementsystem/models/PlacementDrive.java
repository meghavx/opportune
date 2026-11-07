package com.application.placementmanagementsystem.models;

import com.application.placementmanagementsystem.models.enums.DriveStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "placement_drives",
        indexes = {
                @Index(
                        name = "idx_drive_status_date",
                        columnList = "status, drive_date"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacementDrive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "job_role", nullable = false)
    private String jobRole;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @ElementCollection
    @CollectionTable(
            name = "placement_drive_required_skills",
            joinColumns = @JoinColumn(name = "placement_drive_id")
    )
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false, length = 100)
    @Builder.Default
    private List<String> requiredSkills = new ArrayList<>();

    @Column(name = "job_description_file_name")
    private String jobDescriptionFileName;

    @Column(name = "package_offered", nullable = false, precision = 10, scale = 2)
    private BigDecimal packageOffered;

    private String location;

    @Column(name = "application_deadline", nullable = false)
    private LocalDate applicationDeadline;

    @Column(name = "drive_date", nullable = false)
    private LocalDate driveDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriveStatus status;

    @OneToOne(mappedBy = "placementDrive", fetch = FetchType.LAZY)
    private EligibilityCriteria eligibilityCriteria;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
