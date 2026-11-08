package com.application.placementmanagementsystem.mappers;

import com.application.placementmanagementsystem.dtos.student.StudentResponse;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.User;
import org.springframework.stereotype.Component;

@Component
public class StudentMapper {

    public StudentResponse toResponse(Student student) {

        User user = student.getUser();

        return StudentResponse.builder()
                .id(student.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .active(user.isActive())
                .rollNumber(student.getRollNumber())
                .department(student.getDepartment())
                .graduationYear(student.getGraduationYear())
                .cgpa(student.getCgpa())
                .currentBacklogs(student.getCurrentBacklogs())
                .skills(student.getSkills())
                .build();
    }
}