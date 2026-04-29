package com.medicare.hms.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medicare.hms.entity.DoctorAvailability;
import com.medicare.hms.entity.Profile;
import com.medicare.hms.entity.User;
import com.medicare.hms.repository.DoctorAvailabilityRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class AIChatbotService {

    private static final Logger logger = LoggerFactory.getLogger(AIChatbotService.class);
    private static final int MAX_CONTEXT_MESSAGES = 6;
    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestClient restClient;
    private final DoctorService doctorService;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.model:llama-3.1-8b-instant}")
    private String groqModel;

    public AIChatbotService(DoctorService doctorService,
            DoctorAvailabilityRepository doctorAvailabilityRepository,
            RestClient.Builder restClientBuilder) {
        this.doctorService = doctorService;
        this.doctorAvailabilityRepository = doctorAvailabilityRepository;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10000);
        requestFactory.setReadTimeout(30000);
        this.restClient = restClientBuilder.requestFactory(requestFactory).build();
    }

    @Transactional(readOnly = true)
    public String chat(String message, String role, List<ChatHistoryMessage> history) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }

        if (groqApiKey == null || groqApiKey.isBlank()) {
            return "The AI assistant is not configured yet. Please add groq.api.key to the backend application.properties file.";
        }

        List<GroqMessage> messages = new ArrayList<>();
        messages.add(new GroqMessage("system", buildSystemPrompt(role)));

        List<ChatHistoryMessage> recentHistory = trimHistory(history);
        for (ChatHistoryMessage historyMessage : recentHistory) {
            if (historyMessage == null || historyMessage.content() == null || historyMessage.content().isBlank()) {
                continue;
            }
            String speaker = "assistant".equalsIgnoreCase(historyMessage.role()) ? "assistant" : "user";
            messages.add(new GroqMessage(speaker, historyMessage.content()));
        }
        messages.add(new GroqMessage("user", message.trim()));

        GroqRequest request = new GroqRequest(groqModel, messages, 0.3, 700);

        try {
            GroqResponse response = restClient.post()
                    .uri(GROQ_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + groqApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(GroqResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                throw new RestClientException("Groq returned an empty response");
            }

            GroqChoice choice = response.choices().get(0);
            if (choice == null || choice.message() == null || choice.message().content() == null) {
                throw new RestClientException("Groq returned an invalid response");
            }

            return choice.message().content().trim();
        } catch (RestClientResponseException ex) {
            String responseBody = ex.getResponseBodyAsString();
            logger.error("Groq API request failed. status={}, body={}", ex.getStatusCode(), responseBody, ex);
            throw new AIChatbotException(buildGroqErrorMessage(ex.getStatusCode().value(), responseBody), ex);
        } catch (RestClientException ex) {
            logger.error("Groq API request failed before receiving a response: {}", ex.getMessage(), ex);
            return buildOfflineFallback(message, ex);
        }
    }

    private String buildOfflineFallback(String message, RestClientException ex) {
        String lowerMessage = message == null ? "" : message.toLowerCase();
        String reason = getRootCauseMessage(ex);

        if (lowerMessage.contains("doctor") || lowerMessage.contains("available") || lowerMessage.contains("schedule")) {
            return """
                    I cannot reach Groq right now, so I am using Medicare Cure Hub's local doctor data.

                    Available doctors and schedules:
                    %s

                    Network detail: %s
                    """.formatted(buildDoctorContext(), reason);
        }

        if (lowerMessage.contains("appointment") || lowerMessage.contains("book")) {
            return """
                    I cannot reach Groq right now, but you can still book an appointment from Medicare Cure Hub:

                    1. Open the Appointment page.
                    2. Choose an available doctor.
                    3. Pick a date and available slot.
                    4. Add notes about your concern.
                    5. Submit the booking.

                    Network detail: %s
                    """.formatted(reason);
        }

        if (lowerMessage.contains("emergency") || lowerMessage.contains("urgent")
                || lowerMessage.contains("chest pain") || lowerMessage.contains("breathing")) {
            return """
                    If this is a medical emergency, call local emergency services immediately or go to the nearest emergency department.

                    Seek urgent help for chest pain, breathing trouble, stroke symptoms, severe bleeding, loss of consciousness, poisoning, severe allergic reaction, or suicidal thoughts.

                    Network detail: %s
                    """.formatted(reason);
        }

        return """
                I cannot reach Groq right now, so full AI answers are unavailable.

                You can still ask me for local doctor availability, appointment booking steps, or emergency guidance. For symptoms, medications, or lab results, please contact a qualified clinician until the AI connection is restored.

                Network detail: %s
                """.formatted(reason);
    }

    private String getRootCauseMessage(Throwable throwable) {
        Throwable cursor = throwable;
        while (cursor.getCause() != null) {
            cursor = cursor.getCause();
        }
        String message = cursor.getMessage();
        if (message == null || message.isBlank()) {
            message = throwable.getMessage();
        }
        return cursor.getClass().getSimpleName() + (message == null || message.isBlank() ? "" : ": " + message);
    }

    private String buildGroqErrorMessage(int statusCode, String responseBody) {
        String body = responseBody == null ? "" : responseBody.toLowerCase();
        if (statusCode == 401 || body.contains("invalid_api_key") || body.contains("api key")) {
            return "Groq rejected the API key. Please verify groq.api.key in application.properties.";
        }
        if (statusCode == 400 && body.contains("model")) {
            return "Groq rejected the configured model. Please verify groq.model in application.properties.";
        }
        if (statusCode == 429) {
            return "Groq rate limit reached. Please wait a moment and try again.";
        }
        if (statusCode >= 500) {
            return "Groq is temporarily unavailable. Please try again shortly.";
        }
        return "Groq returned an error while generating the assistant response. Check the backend logs for details.";
    }

    private List<ChatHistoryMessage> trimHistory(List<ChatHistoryMessage> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }
        int fromIndex = Math.max(0, history.size() - MAX_CONTEXT_MESSAGES);
        return history.subList(fromIndex, history.size());
    }

    private String buildSystemPrompt(String role) {
        return """
                You are CureBot, the AI care assistant for Medicare Cure Hub. Be concise, friendly, and practical.
                User role: %s.

                Response style:
                - Use short sections with clear labels when helpful.
                - Prefer bullet lists over long paragraphs.
                - Keep each bullet under 18 words.
                - For doctor availability, group each doctor on separate lines.
                - Use plain text only. Do not use tables.

                Role behavior:
                - Patient: greet warmly and guide them toward booking, checking doctors, symptoms, medication basics, or lab results.
                - Doctor: greet professionally and help with schedule awareness, patient communication wording, clinical admin guidance, and general references.
                - Admin: greet operationally and help with doctor availability, appointments, patient flow, and system guidance.

                Safety rules:
                - You are not a replacement for a licensed clinician.
                - For emergencies such as chest pain, breathing trouble, stroke signs, severe bleeding, loss of consciousness, or suicidal thoughts, tell the user to call local emergency services immediately.
                - For symptoms, medication, and lab results, explain in plain language and advise consultation with a qualified doctor.
                - Do not invent doctors, slots, diagnoses, doses, or lab interpretations beyond the provided context.

                Medicare Cure Hub capabilities:
                - Doctor availability queries.
                - Appointment booking guidance.
                - Symptom FAQ.
                - Medication information.
                - Lab result explanation.

                Available doctors and schedules:
                %s
                """.formatted(normalizeRole(role), buildDoctorContext());
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "guest";
        }
        return role.toLowerCase().replace("role_", "").replace("_", " ");
    }

    private String buildDoctorContext() {
        List<User> doctors = doctorService.getAllDoctors();
        if (doctors.isEmpty()) {
            return "No doctors are currently listed in the system.";
        }

        List<String> lines = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        for (User doctor : doctors) {
            String name = getDisplayName(doctor);
            List<DoctorAvailability> availability = doctorAvailabilityRepository.findByDoctorAndIsAvailable(doctor, true);
            String availabilitySummary = availability.isEmpty()
                    ? "availability not configured"
                    : availability.stream()
                            .filter(Objects::nonNull)
                            .map(slot -> {
                                String start = slot.getStartTime() == null ? "?" : slot.getStartTime().format(timeFormatter);
                                String end = slot.getEndTime() == null ? "?" : slot.getEndTime().format(timeFormatter);
                                return "%s %s-%s".formatted(slot.getDayOfWeek(), start, end);
                            })
                            .toList()
                            .stream()
                            .collect(java.util.stream.Collectors.joining(", "));

            lines.add("- Dr. %s (id: %d, username: %s, email: %s): %s"
                    .formatted(name, doctor.getId(), doctor.getUsername(), doctor.getEmail(), availabilitySummary));
        }
        return String.join("\n", lines);
    }

    private String getDisplayName(User user) {
        Profile profile = user.getProfile();
        if (profile != null && profile.getFirstName() != null && !profile.getFirstName().isBlank()) {
            String lastName = profile.getLastName();
            return profile.getFirstName() + (lastName != null && !lastName.isBlank() ? " " + lastName : "");
        }
        return user.getUsername();
    }

    public record ChatHistoryMessage(String role, String content) {
    }

    private record GroqRequest(String model, List<GroqMessage> messages, Double temperature, Integer max_tokens) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GroqMessage(String role, String content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GroqResponse(List<GroqChoice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GroqChoice(GroqMessage message) {
    }

    public static class AIChatbotException extends RuntimeException {
        public AIChatbotException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
