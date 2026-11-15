package com.pancitafashion.api.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ChatRequest(
        @NotEmpty(message = "Escribe una pregunta para iniciar el chat.")
        @Size(max = 12, message = "El chat solo puede enviar los últimos 12 mensajes.")
        List<@NotNull @Valid ChatMessageRequest> messages) {
}
