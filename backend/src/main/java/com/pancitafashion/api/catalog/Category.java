package com.pancitafashion.api.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categorias")
public class Category {

    @Id
    @Column(name = "id_categoria", length = 40)
    private String id;

    @Column(name = "nombre", nullable = false, length = 80)
    private String name;

    protected Category() {
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
