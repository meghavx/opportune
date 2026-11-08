package com.application.placementmanagementsystem.controllers;

import com.application.placementmanagementsystem.common.ApiResponse;
import com.application.placementmanagementsystem.common.ResponseBuilder;
import com.application.placementmanagementsystem.dtos.resume.ResumeResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.ResumeSkillExtractionResponse;
import com.application.placementmanagementsystem.services.resume.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Resume Management")
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(path = "/student/profile/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Upload / Replace Resume")
    public ResponseEntity<ApiResponse<ResumeResponse>> uploadResume(
            @RequestParam("file") MultipartFile file
    ) {

        ResumeResponse response = resumeService.uploadResume(file);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ResponseBuilder.success(
                                "Resume uploaded successfully",
                                response
                        )
                );
    }

    @GetMapping("/student/profile/resume")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "View Resume Details")
    public ResponseEntity<ApiResponse<ResumeResponse>> getResume() {

        ResumeResponse response = resumeService.getResume();

        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Resume fetched successfully",
                        response
                )
        );
    }

    @PostMapping("/student/profile/resume/extract-skills")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Extract Skills from the Current Resume")
    public ResponseEntity<ApiResponse<ResumeSkillExtractionResponse>> extractResumeSkills() {
        ResumeSkillExtractionResponse response = resumeService.extractSkillsFromResume();
        return ResponseEntity.ok(
                ResponseBuilder.success("Resume skills extracted successfully", response)
        );
    }

    @GetMapping("/student/profile/resume/download")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Download Resume")
    public ResponseEntity<ByteArrayResource> downloadResume() {

        ResumeResponse response = resumeService.getResume();

        byte[] file = resumeService.downloadResume();

        ByteArrayResource resource = new ByteArrayResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(response.getFileName())
                                .build()
                                .toString()
                )
                .contentLength(file.length)
                .body(resource);
    }

    @GetMapping("/student/{id}/resume")
    @PreAuthorize("hasAnyRole('PLACEMENT_ADMIN', 'RECRUITER')")
    @Operation(summary = "View Student Resume Details")
    public ResponseEntity<ApiResponse<ResumeResponse>> getStudentResume(@PathVariable Long id) {

        ResumeResponse response = resumeService.getStudentResume(id);

        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Resume fetched successfully",
                        response
                )
        );
    }

    @GetMapping("/student/{id}/resume/download")
    @PreAuthorize("hasAnyRole('PLACEMENT_ADMIN', 'RECRUITER')")
    @Operation(summary = "Download Student Resume")
    public ResponseEntity<ByteArrayResource> downloadStudentResume(@PathVariable Long id) {

        ResumeResponse response = resumeService.getStudentResume(id);

        byte[] file = resumeService.downloadStudentResume(id);

        ByteArrayResource resource = new ByteArrayResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(response.getFileName())
                                .build()
                                .toString()
                )
                .contentLength(file.length)
                .body(resource);
    }
}