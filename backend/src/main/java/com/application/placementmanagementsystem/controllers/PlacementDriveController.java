package com.application.placementmanagementsystem.controllers;

import com.application.placementmanagementsystem.common.ApiResponse;
import com.application.placementmanagementsystem.common.ResponseBuilder;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveCreateRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveSummaryResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveUpdateRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.JobDescriptionSuggestionResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.JobDescriptionTextRequest;
import com.application.placementmanagementsystem.dtos.placementDrive.PlacementDriveWithEligibilityCreateRequest;
import com.application.placementmanagementsystem.models.enums.DriveStatus;
import com.application.placementmanagementsystem.services.ai.AiSuggestionService;
import com.application.placementmanagementsystem.services.placementdrive.PlacementDriveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Tag(name = "Placement Drive Management")
public class PlacementDriveController {

    private final PlacementDriveService placementDriveService;
    private final AiSuggestionService aiSuggestionService;

    @PostMapping(
            path = "/recruiter/drives/extract-details/file",
            consumes = "multipart/form-data"
    )
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Extract Placement Drive Suggestions from a Job Description File")
    public ResponseEntity<ApiResponse<JobDescriptionSuggestionResponse>> extractDriveDetails(
            @RequestParam("file") MultipartFile file
    ) {
        JobDescriptionSuggestionResponse response = aiSuggestionService.extractDriveDetails(file);
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Job description suggestions extracted successfully",
                        response
                )
        );
    }

    @PostMapping("/recruiter/drives/extract-details")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Extract Placement Drive Suggestions from Job Description Text")
    public ResponseEntity<ApiResponse<JobDescriptionSuggestionResponse>> extractDriveDetails(
            @Valid @RequestBody JobDescriptionTextRequest request
    ) {
        JobDescriptionSuggestionResponse response =
                aiSuggestionService.extractDriveDetails(request.text());
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Job description suggestions extracted successfully",
                        response
                )
        );
    }

    @PostMapping("/recruiter/drives")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Create Placement Drive")
    public ResponseEntity<ApiResponse<PlacementDriveResponse>> createPlacementDrive(
            @Valid @RequestBody PlacementDriveCreateRequest request
    ) {
        PlacementDriveResponse response = placementDriveService.createPlacementDrive(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseBuilder.success(
                        "Placement drive created successfully",
                        response
                ));
    }

    @PostMapping("/recruiter/drives/with-eligibility")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Create Placement Drive with Eligibility Criteria")
    public ResponseEntity<ApiResponse<PlacementDriveResponse>> createPlacementDriveWithEligibility(
            @Valid @RequestBody PlacementDriveWithEligibilityCreateRequest request
    ) {
        PlacementDriveResponse response =
                placementDriveService.createPlacementDriveWithEligibility(
                        request.drive(),
                        request.eligibility()
                );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseBuilder.success(
                        "Placement drive created successfully",
                        response
                ));
    }

    @PutMapping("/recruiter/drives/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Update Placement Drive")
    public ResponseEntity<ApiResponse<PlacementDriveResponse>> updatePlacementDrive(
            @PathVariable Long id,
            @Valid @RequestBody PlacementDriveUpdateRequest request
    ) {
        PlacementDriveResponse response = placementDriveService.updatePlacementDrive(id, request);
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Placement drive updated successfully",
                        response
                )
        );
    }

    @PatchMapping("/recruiter/drives/{id}/status")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Update Placement Drive Status")
    public ResponseEntity<ApiResponse<PlacementDriveResponse>> updatePlacementDriveStatus(
            @PathVariable Long id,
            @RequestParam @NotNull DriveStatus status
    ) {
        PlacementDriveResponse response = placementDriveService.updatePlacementDriveStatus(id, status);
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Placement drive status updated successfully",
                        response
                )
        );
    }

    @GetMapping("/drives/{id}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'PLACEMENT_ADMIN', 'STUDENT')")
    @Operation(summary = "Get Placement Drive by ID")
    public ResponseEntity<ApiResponse<PlacementDriveResponse>> getPlacementDrive(
            @PathVariable Long id
    ) {
        PlacementDriveResponse response = placementDriveService.getPlacementDriveById(id);
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Placement drive retrieved successfully",
                        response
                )
        );
    }

    @GetMapping("/drives")
    @PreAuthorize("hasAnyRole('RECRUITER', 'PLACEMENT_ADMIN', 'STUDENT')")
    @Operation(summary = "Get Placement Drives")
    public ResponseEntity<ApiResponse<List<PlacementDriveSummaryResponse>>> getPlacementDrives() {
        List<PlacementDriveSummaryResponse> response = placementDriveService.getPlacementDrives();
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Placement drives retrieved successfully",
                        response
                )
        );
    }
}