package com.application.placementmanagementsystem.dtos.placementDrive;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JobDescriptionTextRequest(
        @NotBlank(message = "Job description text is required")
        @Size(max = 20000, message = "Job description text must not exceed 20,000 characters")
        String text
) {
}
