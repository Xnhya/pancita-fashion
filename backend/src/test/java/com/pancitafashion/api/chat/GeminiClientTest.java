package com.pancitafashion.api.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.test.web.client.response.MockRestResponseCreators;

class GeminiClientTest {

    @Test
    void sendsKeyInHeaderAndParsesGeminiReply() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GeminiClient client = new GeminiClient(
                builder, new ObjectMapper(), "test-key-not-real", "models/gemini-test");
        server.expect(requestTo(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent"))
                .andExpect(header("x-goog-api-key", "test-key-not-real"))
                .andExpect(jsonPath("$.system_instruction.parts[0].text")
                        .value("Solo responde con el catálogo"))
                .andExpect(jsonPath("$.contents[0].role").value("user"))
                .andExpect(jsonPath("$.contents[0].parts[0].text")
                        .value("¿Qué prendas hay?"))
                .andRespond(withSuccess("""
                        {
                          "candidates": [
                            {
                              "content": {
                                "role": "model",
                                "parts": [{"text": "Hay prendas en el catálogo."}]
                              },
                              "finishReason": "STOP"
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        String reply = client.generate(
                "Solo responde con el catálogo",
                List.of(new GeminiClient.Message("user", "¿Qué prendas hay?")));

        assertEquals("Hay prendas en el catálogo.", reply);
        server.verify();
    }

    @Test
    void includesSafeProviderDetailsForModelNotFoundErrors() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GeminiClient client = new GeminiClient(
                builder, new ObjectMapper(), "test-key-not-real", "gemini-test");
        server.expect(requestTo(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent"))
                .andRespond(MockRestResponseCreators.withStatus(
                                org.springframework.http.HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("""
                                {
                                  "error": {
                                    "code": 404,
                                    "message": "models/gemini-test is not found for API version v1beta",
                                    "status": "NOT_FOUND"
                                  }
                                }
                                """));

        GeminiApiException exception = assertInstanceOf(
                GeminiApiException.class,
                org.junit.jupiter.api.Assertions.assertThrows(
                        GeminiApiException.class,
                        () -> client.generate(
                                "Instrucciones internas de Pancita",
                                List.of(new GeminiClient.Message(
                                        "user", "Mi pregunta privada del cliente")))));

        assertEquals(404, exception.getStatusCode());
        assertTrue(exception.getSafeProviderMessage().contains("not found"));
        assertFalse(exception.getSafeProviderMessage().contains("Mi pregunta privada"));
        assertFalse(exception.getSafeProviderMessage().contains("test-key-not-real"));
        server.verify();
    }

    @Test
    void omitsProviderDetailsThatEchoCustomerContent() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GeminiClient client = new GeminiClient(
                builder, new ObjectMapper(), "test-key-not-real", "gemini-test");
        server.expect(requestTo(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent"))
                .andRespond(MockRestResponseCreators.withStatus(
                                org.springframework.http.HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("""
                                {
                                  "error": {
                                    "code": 400,
                                    "message": "Invalid request near Mi pregunta privada del cliente",
                                    "status": "INVALID_ARGUMENT"
                                  }
                                }
                                """));

        GeminiApiException exception = org.junit.jupiter.api.Assertions.assertThrows(
                GeminiApiException.class,
                () -> client.generate(
                        "Instrucciones internas de Pancita",
                        List.of(new GeminiClient.Message(
                                "user", "Mi pregunta privada del cliente"))));

        assertEquals(
                "Gemini incluyó contenido de la solicitud en el error; se omitió el detalle.",
                exception.getSafeProviderMessage());
        server.verify();
    }
}
