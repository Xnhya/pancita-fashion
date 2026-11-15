package com.pancitafashion.api.shared;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException exception) {
        return response(exception.getStatus(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException exception) {
        List<String> errors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(ApiExceptionHandler::formatFieldError)
                .distinct()
                .toList();
        return response(HttpStatus.BAD_REQUEST, String.join(" ", errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidBody() {
        return response(
                HttpStatus.BAD_REQUEST,
                "La solicitud no tiene un formato válido.");
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDatabaseError(
            DataAccessException exception) {
        LOGGER.error("No se pudo completar una operación en la base de datos.", exception);
        return response(
                HttpStatus.SERVICE_UNAVAILABLE,
                "No se pudo acceder a la base de datos. Verifica que MySQL de XAMPP esté encendido y que la configuración sea correcta.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpectedError(Exception exception) {
        LOGGER.error("Error inesperado al atender una solicitud.", exception);
        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrió un error inesperado. Intenta nuevamente más tarde.");
    }

    private static String formatFieldError(FieldError error) {
        return error.getDefaultMessage() == null
                ? "Revisa los datos del pedido."
                : error.getDefaultMessage();
    }

    private static ResponseEntity<Map<String, Object>> response(
            HttpStatus status,
            String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "message", message,
                "timestamp", Instant.now().toString()));
    }
}
