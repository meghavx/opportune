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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
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

    @PostMapping(
            path = "/recruiter/drives/{driveId}/job-description-file",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Attach or Replace Job Description Document")
    public ResponseEntity<ApiResponse<String>> uploadJobDescriptionDocument(
            @PathVariable Long driveId,
            @RequestParam("file") MultipartFile file
    ) {
        String fileName = placementDriveService.uploadJobDescriptionDocument(driveId, file);
        return ResponseEntity.ok(
                ResponseBuilder.success("Job description document saved successfully", fileName)
        );
    }

    @DeleteMapping("/recruiter/drives/{driveId}/job-description-file")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Remove Job Description Document")
    public ResponseEntity<ApiResponse<Void>> deleteJobDescriptionDocument(
            @PathVariable Long driveId
    ) {
        placementDriveService.deleteJobDescriptionDocument(driveId);
        return ResponseEntity.ok(
                ResponseBuilder.success("Job description document removed successfully", null)
        );
    }

    @GetMapping("/drives/{driveId}/job-description-file")
    @PreAuthorize("hasAnyRole('RECRUITER', 'PLACEMENT_ADMIN', 'STUDENT')")
    @Operation(summary = "View or Download Job Description Document")
    public ResponseEntity<ByteArrayResource> downloadJobDescriptionDocument(
            @PathVariable Long driveId
    ) {
        var document = placementDriveService.downloadJobDescriptionDocument(driveId);
        String lowerCaseFileName = document.fileName().toLowerCase(Locale.ROOT);
        MediaType contentType = lowerCaseFileName.endsWith(".pdf")
                ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
        ByteArrayResource resource = new ByteArrayResource(document.file());

        return ResponseEntity.ok()
                .contentType(contentType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(document.fileName())
                                .build()
                                .toString()
                )
                .contentLength(document.file().length)
                .body(resource);
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
    public ResponseEntity<ApiResponse<List<PlacementDriveSummaryResponse>>> getPlacementDrives(
            @RequestParam(defaultValue = "false") boolean showBestMatches
    ) {
        List<PlacementDriveSummaryResponse> response =
                placementDriveService.getPlacementDrives(showBestMatches);
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Placement drives retrieved successfully",
                        response
                )
        );
    }
}