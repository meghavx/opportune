package com.application.placementmanagementsystem.services.resume;

import com.application.placementmanagementsystem.auth.CustomUserPrincipal;
import com.application.placementmanagementsystem.dtos.resume.ResumeResponse;
import com.application.placementmanagementsystem.dtos.placementDrive.ResumeSkillExtractionResponse;
import com.application.placementmanagementsystem.exceptions.ResourceNotFoundException;
import com.application.placementmanagementsystem.mappers.ResumeMapper;
import com.application.placementmanagementsystem.models.Resume;
import com.application.placementmanagementsystem.models.Student;
import com.application.placementmanagementsystem.models.User;
import com.application.placementmanagementsystem.repositories.ResumeRepository;
import com.application.placementmanagementsystem.repositories.StudentRepository;
import com.application.placementmanagementsystem.repositories.UserRepository;
import com.application.placementmanagementsystem.services.ai.AiSuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Transactional
public class ResumeServiceImpl implements ResumeService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private final ResumeRepository resumeRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ResumeMapper resumeMapper;
    private final AiSuggestionService aiSuggestionService;

    @Override
    public ResumeResponse uploadResume(MultipartFile file) {

        validateFile(file);

        Student student = getAuthenticatedStudent();

        Resume resume = resumeRepository.findByStudent(student)
                .orElse(
                        Resume.builder()
                                .student(student)
                                .build()
                );

        try {
            resume.setFileName(file.getOriginalFilename());
            resume.setFile(file.getBytes());
        } catch (IOException e) {
            throw new IllegalArgumentException("Unable to read uploaded file.");
        }

        return resumeMapper.toResponse(
                resumeRepository.save(resume)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeResponse getResume() {

        return resumeMapper.toResponse(getStudentResume());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadResume() {

        return getStudentResume().getFile();
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeSkillExtractionResponse extractSkillsFromResume() {
        Resume resume = getStudentResume();
        return aiSuggestionService.extractResumeSkills(
                resume.getFileName(),
                resume.getFile()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeResponse getStudentResume(Long id) {
        return resumeMapper.toResponse(getStudentResumeEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadStudentResume(Long id) {
        return getStudentResumeEntity(id).getFile();
    }

    // Private Helper Methods

    private Resume getStudentResume() {

        Student student = getAuthenticatedStudent();

        return resumeRepository.findByStudent(student)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Resume not found.")
                );
    }

    private Student getAuthenticatedStudent() {

        CustomUserPrincipal principal =
                (CustomUserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found.")
                );

        return studentRepository.findByUser(user)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found.")
                );
    }

    private Resume getStudentResumeEntity(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student not found with id: " + studentId
                        )
                );
        return resumeRepository.findByStudent(student)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Resume not found."
                        )
                );
    }

    private void validateFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Resume file is required.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Maximum allowed file size is 5 MB.");
        }

        String fileName = file.getOriginalFilename();

        if (fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported.");
        }

        if (!PDF_CONTENT_TYPE.equalsIgnoreCase(file.getContentType())) {
            throw new IllegalArgumentException("Only PDF files are supported.");
        }
    }
}