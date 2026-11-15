package com.pancitafashion.api.orders;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateOrderRequest(
        @Size(max = 120, message = "El nombre no puede superar los 120 caracteres.")
        String customerName,
        @JsonAlias({"customerNote", "notaCliente", "nota"})
        @Size(max = 500, message = "La nota no puede superar los 500 caracteres.")
        String note,
        @NotEmpty(message = "El pedido debe incluir al menos una prenda.")
        @Size(max = 50, message = "El pedido no puede tener más de 50 detalles.")
        List<@NotNull @Valid CreateOrderItemRequest> items) {
}
