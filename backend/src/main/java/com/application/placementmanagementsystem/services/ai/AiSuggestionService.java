package com.application.placementmanagementsystem.services.ai;

import com.application.placementmanagementsystem.dtos.placementDrive.JobDescriptionSuggestionResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AiSuggestionService {

    JobDescriptionSuggestionResponse extractDriveDetails(MultipartFile file);

    JobDescriptionSuggestionResponse extractDriveDetails(String text);
}
