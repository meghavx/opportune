package com.application.placementmanagementsystem.dtos.placementDrive;

import com.application.placementmanagementsystem.dtos.eligibility.EligibilityCriteriaRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record PlacementDriveWithEligibilityCreateRequest(
        @Valid
        @NotNull(message = "Placement drive details are required")
        PlacementDriveCreateRequest drive,

        @Valid
        @NotNull(message = "Eligibility criteria are required")
        EligibilityCriteriaRequest eligibility
) {
}
