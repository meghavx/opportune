package com.application.placementmanagementsystem.dtos.placementDrive;

import com.application.placementmanagementsystem.models.enums.DriveStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlacementDriveSummaryResponse {

    private Long id;

    private String companyName;

    private String jobRole;

    private BigDecimal packageOffered;

    private String location;

    private LocalDate driveDate;

    private DriveStatus status;

    private Boolean eligible;

    private List<String> ineligibilityReasons;

    private Integer skillMatchPercentage;

    private List<String> matchedSkills;

    private List<String> missingSkills;

    private String skillMatchNote;
}