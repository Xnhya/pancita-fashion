package com.pancitafashion.api.orders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreatedOrderResponse(
        Long id,
        String status,
        String deliveryMethod,
        LocalDateTime createdAt,
        int itemCount,
        BigDecimal total,
        List<CreatedOrderItemResponse> items) {
}
