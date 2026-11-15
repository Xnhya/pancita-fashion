package com.pancitafashion.api.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.pancitafashion.api.catalog.ProductService;
import com.pancitafashion.api.shared.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class ChatServiceTest {

    private final ProductService productService = mock(ProductService.class);
    private final GeminiClient geminiClient = mock(GeminiClient.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void reportsMissingKeyWithoutCallingGemini() {
        ChatService chatService = new ChatService(
                productService, geminiClient, objectMapper, "");

        ApiException exception = assertThrows(
                ApiException.class,
                () -> chatService.reply(request("¿Qué prendas tienen?")));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertTrue(exception.getMessage().contains("no está configurado"));
        verifyNoInteractions(productService, geminiClient);
    }

    @Test
    void translatesGeminiRateLimitIntoAHelpfulMessage() {
        when(productService.findAll()).thenReturn(List.of());
        when(geminiClient.generate(anyString(), anyList()))
                .thenThrow(new GeminiApiException(429, "quota exceeded"));
        ChatService chatService = new ChatService(
                productService, geminiClient, objectMapper, "test-key-not-real");

        ApiException exception = assertThrows(
                ApiException.class,
                () -> chatService.reply(request("¿Está disponible mi talla?")));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertTrue(exception.getMessage().contains("límite de consultas"));
        assertTrue(exception.getMessage().contains("WhatsApp"));
    }

    private static ChatRequest request(String content) {
        return new ChatRequest(List.of(new ChatMessageRequest("user", content)));
    }
}
