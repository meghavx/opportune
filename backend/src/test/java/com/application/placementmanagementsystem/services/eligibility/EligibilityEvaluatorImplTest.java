package com.application.placementmanagementsystem.services.eligibility;

import com.application.placementmanagementsystem.dtos.eligibility.EligibilityEvaluationResult;
import com.application.placementmanagementsystem.models.EligibilityCriteria;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.enums.Department;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EligibilityEvaluatorImplTest {

    private final EligibilityEvaluatorImpl evaluator = new EligibilityEvaluatorImpl();

    @Test
    void acceptsGraduationYearAtOrAboveMinimum() {
        assertTrue(evaluate(2025).isEligible());
        assertTrue(evaluate(2026).isEligible());
    }

    @Test
    void rejectsGraduationYearBelowMinimumWithMinimumYearReason() {
        EligibilityEvaluationResult result = evaluate(2024);

        assertFalse(result.isEligible());
        assertEquals(
                "Minimum graduation year required is 2025",
                result.getIneligibilityReasons().get(0)
        );
    }

    private EligibilityEvaluationResult evaluate(int graduationYear) {
        Student student = Student.builder()
                .department(Department.CSE)
                .graduationYear(graduationYear)
                .cgpa(new BigDecimal("8.00"))
                .currentBacklogs(0)
                .build();
        EligibilityCriteria criteria = EligibilityCriteria.builder()
                .minCgpa(new BigDecimal("7.00"))
                .department(null)
                .graduationYear(2025)
                .maxBacklogs(0)
                .build();
        PlacementDrive drive = PlacementDrive.builder()
                .eligibilityCriteria(criteria)
                .build();

        return evaluator.evaluate(student, drive);
    }
}
