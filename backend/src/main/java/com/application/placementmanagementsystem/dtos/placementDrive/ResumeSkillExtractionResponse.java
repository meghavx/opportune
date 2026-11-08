package com.application.placementmanagementsystem.dtos.placementDrive;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.List;

public record ResumeSkillExtractionResponse(
        @JsonAlias("skills")
        List<String> skills
) {
}
