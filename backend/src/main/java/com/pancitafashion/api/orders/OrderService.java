package com.pancitafashion.api.orders;

import com.pancitafashion.api.catalog.Product;
import com.pancitafashion.api.catalog.ProductRepository;
import com.pancitafashion.api.shared.ApiException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CreatedOrderResponse create(CreateOrderRequest request) {
        CustomerOrder order = new CustomerOrder(
                normalize(request.customerName()),
                normalize(request.note()));
        List<CreatedOrderItemResponse> responseItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        int itemCount = 0;

        for (CreateOrderItemRequest requestedItem : request.items()) {
            Product product = productRepository
                    .findByIdAndActiveTrue(requestedItem.productId())
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.UNPROCESSABLE_ENTITY,
                            "Una de las prendas ya no está disponible en el catálogo."));

            String size = requestedItem.size().trim();
            if (!product.getSizes().contains(size)) {
                throw new ApiException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "La talla seleccionada no está disponible para "
                                + product.getName() + ".");
            }

            String color = normalize(requestedItem.color());
            if (!product.getColors().isEmpty()
                    && (color == null || !product.getColors().contains(color))) {
                throw new ApiException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "Selecciona un color disponible para " + product.getName() + ".");
            }
            if (product.getColors().isEmpty() && color != null) {
                throw new ApiException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "El color seleccionado no está disponible para "
                                + product.getName() + ".");
            }

            OrderItem orderItem = new OrderItem(
                    product,
                    size,
                    color,
                    requestedItem.quantity());
            order.addItem(orderItem);

            BigDecimal subtotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(requestedItem.quantity()));
            total = total.add(subtotal);
            itemCount += requestedItem.quantity();
            responseItems.add(new CreatedOrderItemResponse(
                    product.getId(),
                    product.getName(),
                    size,
                    color,
                    requestedItem.quantity(),
                    product.getPrice(),
                    subtotal));
        }

        CustomerOrder savedOrder = orderRepository.saveAndFlush(order);
        return new CreatedOrderResponse(
                savedOrder.getId(),
                savedOrder.getStatus().name(),
                savedOrder.getDeliveryMethod().name(),
                savedOrder.getCreatedAt(),
                itemCount,
                total,
                List.copyOf(responseItems));
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
