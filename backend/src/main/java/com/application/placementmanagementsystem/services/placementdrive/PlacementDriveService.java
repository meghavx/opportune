package com.application.placementmanagementsystem.services.placementdrive;

import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveCreateRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveSummaryResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveUpdateRequest;
import com.application.placementmanagementsystem.dtos.eligibility.EligibilityCriteriaRequest;
import com.application.placementmanagementsystem.models.enums.DriveStatus;

import java.util.List;

public interface PlacementDriveService {

    PlacementDriveResponse createPlacementDrive(PlacementDriveCreateRequest request);

    PlacementDriveResponse createPlacementDriveWithEligibility(
            PlacementDriveCreateRequest driveRequest,
            EligibilityCriteriaRequest eligibilityRequest
    );

    PlacementDriveResponse updatePlacementDrive(Long driveId, PlacementDriveUpdateRequest request);

    PlacementDriveResponse updatePlacementDriveStatus(Long driveId, DriveStatus status);

    PlacementDriveResponse getPlacementDriveById(Long driveId);

    List<PlacementDriveSummaryResponse> getPlacementDrives();
}