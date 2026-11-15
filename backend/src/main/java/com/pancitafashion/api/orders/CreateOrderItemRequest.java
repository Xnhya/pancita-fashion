package com.pancitafashion.api.orders;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOrderItemRequest(
        @NotBlank(message = "Cada prenda debe indicar un producto.")
        @Size(max = 60, message = "El código del producto no es válido.")
        String productId,
        @NotBlank(message = "Cada prenda debe indicar una talla.")
        @Size(max = 20, message = "La talla no es válida.")
        String size,
        @Size(max = 60, message = "El color no es válido.")
        String color,
        @Min(value = 1, message = "La cantidad mínima por prenda es 1.")
        @Max(value = 100, message = "La cantidad máxima por detalle es 100.")
        int quantity) {
}
