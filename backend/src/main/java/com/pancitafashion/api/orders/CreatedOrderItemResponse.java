package com.pancitafashion.api.orders;

import java.math.BigDecimal;

public record CreatedOrderItemResponse(
        String productId,
        String productName,
        String size,
        String color,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal) {
}
