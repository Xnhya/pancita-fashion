package com.pancitafashion.api.orders;

import com.pancitafashion.api.catalog.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "detalle_pedido")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pedido", nullable = false)
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_producto")
    private Product product;

    @Column(name = "nombre_producto", nullable = false, length = 160)
    private String productName;

    @Column(name = "talla", length = 20)
    private String size;

    @Column(name = "color", length = 60)
    private String color;

    @Column(name = "cantidad", nullable = false)
    private int quantity;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected OrderItem() {
    }

    public OrderItem(
            Product product,
            String size,
            String color,
            int quantity) {
        this.product = product;
        this.productName = product.getName();
        this.size = size;
        this.color = color;
        this.quantity = quantity;
        this.unitPrice = product.getPrice();
    }

    @PrePersist
    void setCreationTimestamp() {
        createdAt = LocalDateTime.now();
    }

    void setOrder(CustomerOrder order) {
        this.order = order;
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public String getProductName() {
        return productName;
    }

    public String getSize() {
        return size;
    }

    public String getColor() {
        return color;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
}
