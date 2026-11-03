package com.application.placementmanagementsystem.dtos.placementDrive;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record JobDescriptionSuggestionResponse(
        String jobRole,
        String jobDescription,
        BigDecimal packageOffered,
        String location,
        EligibilitySuggestion eligibility,
        List<String> warnings
) {
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record EligibilitySuggestion(
            BigDecimal minCgpa,
            String department,
            Integer maxBacklogs,
            Integer graduationYear
    ) {
    }
}
