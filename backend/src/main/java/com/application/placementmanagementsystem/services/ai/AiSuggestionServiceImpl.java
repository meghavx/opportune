package com.application.placementmanagementsystem.services.ai;

import com.application.placementmanagementsystem.dtos.placementDrive.JobDescriptionSuggestionResponse;
import com.application.placementmanagementsystem.exceptions.AiServiceException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;

@Service
public class AiSuggestionServiceImpl implements AiSuggestionService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final String EXTRACTION_PATH = "/extract-drive-details/file";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AiSuggestionServiceImpl(
            @Qualifier("aiServiceRestClientBuilder") RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(aiServiceUrl).build();
        this.objectMapper = objectMapper;
    }

    @Override
    public JobDescriptionSuggestionResponse extractDriveDetails(MultipartFile file) {
        validateFile(file);

        ByteArrayResource fileResource;
        try {
            fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the uploaded file.");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentDisposition(
                ContentDisposition.formData()
                        .name("file")
                        .filename(file.getOriginalFilename())
                        .build()
        );
        fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        body.add("file", new HttpEntity<>(fileResource, fileHeaders));

        try {
            JobDescriptionSuggestionResponse response = restClient
                    .post()
                    .uri(EXTRACTION_PATH)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(JobDescriptionSuggestionResponse.class);

            if (response == null) {
                throw new AiServiceException(
                        HttpStatus.BAD_GATEWAY,
                        "JD extraction service returned an empty response."
                );
            }
            return response;
        } catch (RestClientResponseException exception) {
            HttpStatus status = exception.getStatusCode().is4xxClientError()
                    ? HttpStatus.valueOf(exception.getStatusCode().value())
                    : HttpStatus.BAD_GATEWAY;
            throw new AiServiceException(status, getServiceErrorMessage(exception));
        } catch (ResourceAccessException exception) {
            throw new AiServiceException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "JD extraction service is unavailable. Check that the AI service and Ollama are running."
            );
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A job description file is required.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Maximum allowed file size is 5 MB.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("A filename is required.");
        }

        String lowercaseFilename = filename.toLowerCase(Locale.ROOT);
        if (!lowercaseFilename.endsWith(".pdf") && !lowercaseFilename.endsWith(".docx")) {
            throw new IllegalArgumentException("Only PDF and DOCX files are supported.");
        }
    }

    private String getServiceErrorMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (!responseBody.isBlank()) {
            try {
                JsonNode detail = objectMapper.readTree(responseBody).get("detail");
                if (detail != null && detail.isTextual()) {
                    return detail.asText();
                }
            } catch (JsonProcessingException ignored) {
                return responseBody;
            }
            return responseBody;
        }
        return "JD extraction service returned an error.";
    }
}
