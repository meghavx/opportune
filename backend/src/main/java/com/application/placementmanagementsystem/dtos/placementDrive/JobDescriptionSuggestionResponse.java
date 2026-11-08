package com.application.placementmanagementsystem.dtos.placementDrive;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;
import java.util.List;

public record JobDescriptionSuggestionResponse(
        @JsonAlias("job_role")
        String jobRole,
        @JsonAlias("job_description")
        String jobDescription,
        @JsonAlias("package_offered")
        BigDecimal packageOffered,
        String location,
        @JsonAlias("required_skills")
        List<String> requiredSkills,
        EligibilitySuggestion eligibility,
        List<String> warnings
) {
    public record EligibilitySuggestion(
            @JsonAlias("min_cgpa")
            BigDecimal minCgpa,
            String department,
            @JsonAlias("max_backlogs")
            Integer maxBacklogs,
            @JsonAlias("graduation_year")
            Integer graduationYear
    ) {
    }
}
