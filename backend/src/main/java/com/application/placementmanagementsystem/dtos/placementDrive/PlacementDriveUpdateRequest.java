package com.application.placementmanagementsystem.dtos.placementDrive;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
public class PlacementDriveUpdateRequest {

    @NotBlank(message = "Job role is required")
    private String jobRole;

    private String jobDescription;

    @Size(max = 50, message = "A maximum of 50 required skills is allowed")
    private List<@NotBlank @Size(max = 100) String> requiredSkills;

    @NotNull(message = "Package offered is required")
    @DecimalMin(value = "0.01", message = "Package offered must be greater than 0")
    private BigDecimal packageOffered;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Application deadline is required")
    @FutureOrPresent(message = "Application deadline cannot be in the past")
    private LocalDate applicationDeadline;

    @NotNull(message = "Drive date is required")
    @FutureOrPresent(message = "Drive date cannot be in the past")
    private LocalDate driveDate;
}