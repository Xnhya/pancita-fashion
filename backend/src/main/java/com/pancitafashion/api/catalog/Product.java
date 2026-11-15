package com.pancitafashion.api.catalog;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "productos")
public class Product {

    @Id
    @Column(name = "id_producto", length = 60)
    private String id;

    @Column(name = "nombre", nullable = false, length = 160)
    private String name;

    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "precio", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "moneda", nullable = false, length = 3, columnDefinition = "CHAR(3)")
    private String currency;

    @Column(name = "imagen_url", nullable = false, length = 255)
    private String image;

    @Column(name = "imagen_descripcion", nullable = false, length = 255)
    private String imageAlt;

    @Column(name = "activo", nullable = false)
    private boolean active;

    @Column(name = "creado_en", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "actualizado_en", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "producto_categorias",
            joinColumns = @JoinColumn(name = "id_producto"),
            inverseJoinColumns = @JoinColumn(name = "id_categoria"))
    @OrderBy("name ASC")
    private Set<Category> categories = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "producto_tallas",
            joinColumns = @JoinColumn(name = "id_producto"))
    @Column(name = "talla", nullable = false, length = 20)
    @OrderBy("talla ASC")
    private Set<String> sizes = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "producto_colores",
            joinColumns = @JoinColumn(name = "id_producto"))
    @Column(name = "color", nullable = false, length = 60)
    @OrderBy("color ASC")
    private Set<String> colors = new LinkedHashSet<>();

    protected Product() {
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getCurrency() {
        return currency;
    }

    public String getImage() {
        return image;
    }

    public String getImageAlt() {
        return imageAlt;
    }

    public boolean isActive() {
        return active;
    }

    public Set<Category> getCategories() {
        return categories;
    }

    public Set<String> getSizes() {
        return sizes;
    }

    public Set<String> getColors() {
        return colors;
    }
}
