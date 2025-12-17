package com.livebid.user.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor // Assuming Lombok is available check pom, if not generate getters/setters
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String googleId;

    private String name;

    @Column(nullable = false)
    private long availableBalance; // In cents

    @Column(nullable = false)
    private long reservedBalance; // Locked funds
}
