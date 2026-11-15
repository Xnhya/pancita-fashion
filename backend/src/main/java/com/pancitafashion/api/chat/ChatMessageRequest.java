package com.pancitafashion.api.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        @NotBlank
        @Pattern(regexp = "user|assistant", message = "El mensaje del chat no es válido.")
        String role,
        @NotBlank(message = "Escribe un mensaje antes de enviarlo.")
        @Size(max = 1200, message = "El mensaje no puede superar los 1200 caracteres.")
        String content) {
}
