package com.application.placementmanagementsystem.services.ai;

import com.application.placementmanagementsystem.dtos.placementDrive.JobDescriptionSuggestionResponse;
import com.application.placementmanagementsystem.exceptions.AiServiceException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;

class AiSuggestionServiceImplTest {

    private MockRestServiceServer server;
    private AiSuggestionServiceImpl service;

    @BeforeEach
    void setUp() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        server = MockRestServiceServer.bindTo(restClientBuilder).build();
        service = new AiSuggestionServiceImpl(
                restClientBuilder,
                new ObjectMapper(),
                "http://ai-service"
        );
    }

    @Test
    void forwardsFileAndMapsSnakeCaseSuggestions() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "job-description.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Job description text".getBytes()
        );
        String responseBody = """
                {
                  "job_role": "Engineering Trainee",
                  "job_description": "Build enterprise solutions.",
                  "package_offered": null,
                  "location": "Bengaluru",
                  "eligibility": {
                    "min_cgpa": 7.0,
                    "department": null,
                    "max_backlogs": 0,
                    "graduation_year": 2025
                  },
                  "warnings": ["Confirm eligible batches."]
                }
                """;

        server.expect(requestTo("http://ai-service/extract-drive-details/file"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.MULTIPART_FORM_DATA))
                .andExpect(request -> {
                    MediaType contentType = request.getHeaders().getContentType();
                    assertNotNull(contentType);
                    assertEquals("multipart", contentType.getType());
                    assertNotNull(contentType.getParameter("boundary"));
                })
                .andExpect(content().string(allOf(
                        containsString("name=\"file\""),
                        containsString("filename=\"job-description.docx\""),
                        containsString("Job description text")
                )))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        JobDescriptionSuggestionResponse response = service.extractDriveDetails(file);

        assertEquals("Engineering Trainee", response.jobRole());
        assertEquals(2025, response.eligibility().graduationYear());
        assertEquals(7.0, response.eligibility().minCgpa().doubleValue());
        assertEquals("Confirm eligible batches.", response.warnings().getFirst());
        String apiJson = new ObjectMapper().valueToTree(response).toString();
        assertTrue(apiJson.contains("\"jobRole\""));
        assertTrue(apiJson.contains("\"minCgpa\""));
        assertFalse(apiJson.contains("\"job_role\""));
        server.verify();
    }

    @Test
    void reportsFastApiValidationErrors() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "job.pdf",
                "application/pdf",
                "not a valid PDF".getBytes()
        );
        server.expect(requestTo("http://ai-service/extract-drive-details/file"))
                .andRespond(withBadRequest().body("{\"detail\":\"The PDF is invalid.\"}"));

        AiServiceException exception = assertThrows(
                AiServiceException.class,
                () -> service.extractDriveDetails(file)
        );

        assertEquals(400, exception.getStatus().value());
        assertEquals("The PDF is invalid.", exception.getMessage());
        server.verify();
    }

    @Test
    void rejectsUnsupportedFilesBeforeCallingFastApi() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "job.doc",
                "application/msword",
                "legacy document".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> service.extractDriveDetails(file));
        server.verify();
    }

    @Test
    void forwardsTextAndMapsSnakeCaseSuggestions() {
        String text = "Engineering Trainee in Bengaluru";
        String responseBody = """
                {
                  "job_role": "Engineering Trainee",
                  "job_description": "Build enterprise solutions.",
                  "package_offered": null,
                  "location": "Bengaluru",
                  "eligibility": {
                    "min_cgpa": 7.0,
                    "department": null,
                    "max_backlogs": 0,
                    "graduation_year": 2025
                  },
                  "warnings": []
                }
                """;
        server.expect(requestTo("http://ai-service/extract-drive-details"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"text\":\"Engineering Trainee in Bengaluru\"}"))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        JobDescriptionSuggestionResponse response = service.extractDriveDetails(text);

        assertEquals("Engineering Trainee", response.jobRole());
        assertEquals("Bengaluru", response.location());
        server.verify();
    }

    @Test
    void rejectsBlankTextWithoutCallingFastApi() {
        assertThrows(IllegalArgumentException.class, () -> service.extractDriveDetails("  "));
        server.verify();
    }

    @Test
    void rejectsTextOverLimitWithoutCallingFastApi() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.extractDriveDetails("x".repeat(20_001))
        );
        server.verify();
    }

}
