package com.application.placementmanagementsystem.services.eligibility;

import com.application.placementmanagementsystem.dtos.eligibility.EligibilityEvaluationResult;
import com.application.placementmanagementsystem.models.EligibilityCriteria;
import com.application.placementmanagementsystem.models.PlacementDrive;
import com.application.placementmanagementsystem.models.Student;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EligibilityEvaluatorImpl implements EligibilityEvaluator {

    @Override
    public EligibilityEvaluationResult evaluate(
            Student student,
            PlacementDrive drive
    ) {
        EligibilityCriteria criteria = drive.getEligibilityCriteria();

        if (criteria == null) {
            return EligibilityEvaluationResult.builder()
                    .eligible(false)
                    .ineligibilityReasons(List.of("Eligibility criteria not configured."))
                    .build();
        }

        List<String> reasons = new ArrayList<>();

        if (student.getCgpa().compareTo(criteria.getMinCgpa()) < 0) {
            reasons.add(
                    "Minimum CGPA required is " + criteria.getMinCgpa()
            );
        }

        if (criteria.getDepartment() != null
                && !student.getDepartment().equals(criteria.getDepartment())) {
            reasons.add(
                    "Department is not eligible."
            );
        }

        if (student.getGraduationYear() < criteria.getGraduationYear()) {
            reasons.add(
                    "Minimum graduation year required is " + criteria.getGraduationYear()
            );
        }

        if (student.getCurrentBacklogs() > criteria.getMaxBacklogs()) {
            reasons.add(
                    "Maximum backlogs allowed is " + criteria.getMaxBacklogs()
            );
        }

        return EligibilityEvaluationResult.builder()
                .eligible(reasons.isEmpty())
                .ineligibilityReasons(reasons)
                .build();
    }
}