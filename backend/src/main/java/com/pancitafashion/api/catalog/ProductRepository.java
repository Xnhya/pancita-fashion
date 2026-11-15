package com.pancitafashion.api.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, String> {

    @EntityGraph(attributePaths = {"categories", "sizes", "colors"})
    List<Product> findAllByActiveTrueOrderByNameAsc();

    @EntityGraph(attributePaths = {"categories", "sizes", "colors"})
    Optional<Product> findByIdAndActiveTrue(String id);
}
