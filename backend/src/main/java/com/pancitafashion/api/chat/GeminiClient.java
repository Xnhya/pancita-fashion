package com.pancitafashion.api.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class GeminiClient {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;

    private static final List<SafetySetting> DEFAULT_SAFETY_SETTINGS = List.of(
            new SafetySetting("HARM_CATEGORY_HARASSMENT", "BLOCK_ONLY_HIGH"),
            new SafetySetting("HARM_CATEGORY_HATE_SPEECH", "BLOCK_ONLY_HIGH"),
            new SafetySetting("HARM_CATEGORY_SEXUALLY_EXPLICIT", "BLOCK_ONLY_HIGH"),
            new SafetySetting("HARM_CATEGORY_DANGEROUS_CONTENT", "BLOCK_ONLY_HIGH")
    );

    public GeminiClient(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.model:gemini-3.8-flash}") String model) {
        this.restClient = restClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        String resolvedModel = (model == null || model.isBlank() || model.contains("gemini-2.0-flash") || model.contains("gemini-3.5-flash-lite"))
                ? "gemini-3.8-flash"
                : model;
        this.model = resolvedModel.startsWith("models/") ? resolvedModel.substring("models/".length()) : resolvedModel;
    }

    public String generate(String systemInstruction, List<Message> messages) {
        List<Content> contents = messages.stream()
                .map(message -> new Content(
                        message.role().equals("assistant") ? "model" : "user",
                        List.of(new Part(message.content()))))
                .toList();

        int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                GeminiResponse response = restClient.post()
                        .uri("/models/{model}:generateContent", model)
                        .header("x-goog-api-key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new GenerateRequest(
                                new SystemInstruction(List.of(new Part(systemInstruction))),
                                contents,
                                DEFAULT_SAFETY_SETTINGS,
                                new GenerationConfig(0.2, 500)))
                        .retrieve()
                        .body(GeminiResponse.class);

                if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
                    throw new GeminiApiException(502, "Gemini no devolvió candidatos.");
                }

                Candidate candidate = response.candidates().get(0);
                if (candidate.finishReason() != null && candidate.finishReason().equalsIgnoreCase("SAFETY")) {
                    return "Nuestras prendas de maternidad y lactancia están pensadas para tu comodidad. Te invitamos a consultar con la tienda por WhatsApp para más detalles y pedidos.";
                }

                if (candidate.content() == null || candidate.content().parts() == null) {
                    throw new GeminiApiException(502, "Gemini devolvió un candidato sin contenido.");
                }

                String reply = candidate.content().parts().stream()
                        .filter(Objects::nonNull)
                        .map(Part::text)
                        .filter(Objects::nonNull)
                        .collect(Collectors.joining())
                        .trim();
                if (reply.isBlank()) {
                    throw new GeminiApiException(502, "Gemini devolvió texto en blanco.");
                }
                return reply;
            } catch (RestClientResponseException exception) {
                int status = exception.getStatusCode().value();
                if ((status == 503 || status == 500) && attempt < maxAttempts) {
                    try {
                        Thread.sleep(attempt * 1200L);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue;
                }
                throw new GeminiApiException(
                        status,
                        safeProviderMessage(
                                exception.getResponseBodyAsString(),
                                systemInstruction,
                                messages));
            } catch (RestClientException exception) {
                throw exception;
            }
        }
        throw new GeminiApiException(503, "No se pudo obtener respuesta de Gemini tras varios intentos.");
    }

    public record Message(String role, String content) {
    }

    private record Part(String text) {
    }

    private record Content(String role, List<Part> parts) {
    }

    private record SystemInstruction(
            List<Part> parts) {
    }

    private record GenerationConfig(double temperature, int maxOutputTokens) {
    }

    private record SafetySetting(
            @JsonProperty("category") String category,
            @JsonProperty("threshold") String threshold) {
    }

    private record GenerateRequest(
            @JsonProperty("system_instruction")
            SystemInstruction systemInstruction,
            List<Content> contents,
            @JsonProperty("safetySettings")
            List<SafetySetting> safetySettings,
            GenerationConfig generationConfig) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiResponse(List<Candidate> candidates) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Candidate(Content content, String finishReason) {
    }

    private String safeProviderMessage(
            String responseBody,
            String systemInstruction,
            List<Message> messages) {
        try {
            JsonNode response = objectMapper.readTree(responseBody);
            if (response == null) {
                return "Gemini no proporcionó un detalle adicional.";
            }
            JsonNode messageNode = response.path("error").path("message");
            if (!messageNode.isTextual() || messageNode.asText().isBlank()) {
                return "Gemini no proporcionó un detalle adicional.";
            }
            String providerMessage = messageNode.asText();
            if (containsSensitiveContent(providerMessage, systemInstruction, messages)) {
                return "Gemini incluyó contenido de la solicitud en el error; se omitió el detalle.";
            }
            return providerMessage.length() > 300
                    ? providerMessage.substring(0, 300)
                    : providerMessage;
        } catch (JsonProcessingException exception) {
            return "Gemini devolvió un error sin formato JSON.";
        }
    }

    private boolean containsSensitiveContent(
            String providerMessage,
            String systemInstruction,
            List<Message> messages) {
        if (containsLongFragment(providerMessage, apiKey)) {
            return true;
        }
        if (containsLongFragment(providerMessage, systemInstruction)) {
            return true;
        }
        return messages.stream()
                .anyMatch(message -> containsLongFragment(providerMessage, message.content()));
    }

    private static boolean containsLongFragment(String text, String possibleSecret) {
        int fragmentLength = 8;
        if (possibleSecret == null || possibleSecret.length() < fragmentLength) {
            return possibleSecret != null && !possibleSecret.isBlank()
                    && text.contains(possibleSecret);
        }
        for (int start = 0; start <= possibleSecret.length() - fragmentLength; start++) {
            if (text.contains(possibleSecret.substring(start, start + fragmentLength))) {
                return true;
            }
        }
        return false;
    }
}
