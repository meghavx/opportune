package com.application.placementmanagementsystem.mappers;

import com.application.placementmanagementsystem.dtos.placementDrive.*;
import com.application.placementmanagementsystem.models.Company;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PlacementDriveMapper {

    private final EligibilityCriteriaMapper eligibilityCriteriaMapper;

    public PlacementDriveResponse toResponse(PlacementDrive drive) {
        return PlacementDriveResponse.builder()
                .id(drive.getId())
                .companyId(drive.getCompany().getId())
                .companyName(drive.getCompany().getCompanyName())
                .jobRole(drive.getJobRole())
                .jobDescription(drive.getJobDescription())
                .requiredSkills(drive.getRequiredSkills())
                .jobDescriptionFileName(drive.getJobDescriptionFileName())
                .packageOffered(drive.getPackageOffered())
                .location(drive.getLocation())
                .applicationDeadline(drive.getApplicationDeadline())
                .driveDate(drive.getDriveDate())
                .status(drive.getStatus())
                .eligibility(
                        eligibilityCriteriaMapper.toResponse(
                                drive.getEligibilityCriteria()
                        ))
                .createdAt(drive.getCreatedAt())
                .updatedAt(drive.getUpdatedAt())
                .build();
    }

    public PlacementDriveSummaryResponse toSummaryResponse(PlacementDrive drive) {
        return PlacementDriveSummaryResponse.builder()
                .id(drive.getId())
                .companyName(drive.getCompany().getCompanyName())
                .jobRole(drive.getJobRole())
                .packageOffered(drive.getPackageOffered())
                .location(drive.getLocation())
                .driveDate(drive.getDriveDate())
                .status(drive.getStatus())
                .build();
    }

    public List<PlacementDriveSummaryResponse> toSummaryResponseList(List<PlacementDrive> drives) {
        return drives.stream()
                .map(this::toSummaryResponse)
                .toList();
    }
}