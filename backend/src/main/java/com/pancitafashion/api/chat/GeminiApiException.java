package com.pancitafashion.api.chat;

public class GeminiApiException extends RuntimeException {

    private final int statusCode;
    private final String safeProviderMessage;

    public GeminiApiException(int statusCode, String safeProviderMessage) {
        super("Gemini respondió con el código " + statusCode + ".");
        this.statusCode = statusCode;
        this.safeProviderMessage = safeProviderMessage;
    }

    public GeminiApiException() {
        super("Gemini devolvió una respuesta sin texto.");
        this.statusCode = 502;
        this.safeProviderMessage = "Gemini devolvió una respuesta sin texto.";
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getSafeProviderMessage() {
        return safeProviderMessage;
    }
}
