package com.application.placementmanagementsystem.dtos.eligibility;

import com.application.placementmanagementsystem.models.enums.Department;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EligibilityCriteriaRequest {

    @NotNull(message = "Minimum CGPA is required")
    @DecimalMin(value = "0.00", message = "Minimum CGPA must be at least 0")
    @DecimalMax(value = "10.00", message = "Minimum CGPA cannot exceed 10")
    private BigDecimal minCgpa;

    private Department department;

    @NotNull(message = "Maximum backlogs is required")
    @Min(value = 0, message = "Maximum backlogs cannot be negative")
    private Integer maxBacklogs;

    @NotNull(message = "Graduation year is required")
    private Integer graduationYear;
}