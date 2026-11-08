package com.application.placementmanagementsystem.services.resume;

import com.application.placementmanagementsystem.dtos.resume.ResumeResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.ResumeSkillExtractionResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ResumeService {

    ResumeResponse uploadResume(MultipartFile file);

    ResumeResponse getResume();

    byte[] downloadResume();

    ResumeSkillExtractionResponse extractSkillsFromResume();

    ResumeResponse getStudentResume(Long id);

    byte[] downloadStudentResume(Long id);
}