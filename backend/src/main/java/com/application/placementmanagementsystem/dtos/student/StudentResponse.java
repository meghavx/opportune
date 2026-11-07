package com.application.placementmanagementsystem.dtos.student;

import com.application.placementmanagementsystem.models.enums.Department;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class StudentResponse {

    private long id;

    private Long userId;

    private String fullName;

    private String email;

    private String phoneNumber;

    private String rollNumber;

    private Department department;

    private int graduationYear;

    private BigDecimal cgpa;

    private int currentBacklogs;

    private List<String> skills;

    private boolean active;
}
