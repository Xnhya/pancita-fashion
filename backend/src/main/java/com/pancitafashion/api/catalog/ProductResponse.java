package com.pancitafashion.api.catalog;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public record ProductResponse(
        String id,
        String name,
        String description,
        BigDecimal price,
        String currency,
        String image,
        String imageAlt,
        List<String> categories,
        List<String> sizes,
        List<String> colors) {

    private static final List<String> STANDARD_SIZES =
            List.of("XS", "S", "M", "L", "XL", "XXL");

    static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getCurrency(),
                product.getImage(),
                product.getImageAlt(),
                product.getCategories().stream()
                        .map(Category::getName)
                        .sorted()
                        .toList(),
                product.getSizes().stream()
                        .sorted(Comparator.comparingInt(size -> {
                            int order = STANDARD_SIZES.indexOf(size);
                            return order < 0 ? Integer.MAX_VALUE : order;
                        }))
                        .toList(),
                product.getColors().stream().sorted().toList());
    }
}
