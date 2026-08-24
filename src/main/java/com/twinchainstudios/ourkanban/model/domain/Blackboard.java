package com.twinchainstudios.ourkanban.model.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "blackboards")
public class Blackboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "project_id", unique = true)
    private Project project;

    // Absolute grid coordinates, inclusive on both ends. Growing the board
    // from any edge only ever changes these four bounds — it never touches
    // any element's row/col, since those are stored as absolute coordinates
    // rather than being relative to the board's current size. This keeps
    // "add a column on the left" a single-field update instead of a mass
    // rewrite of every element on the board.
    private int minRow = 0;
    private int maxRow = 5;
    private int minCol = 0;
    private int maxCol = 5;

    @OneToMany(mappedBy = "blackboard", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<BlackboardElement> elements = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public int getMinRow() {
        return minRow;
    }

    public void setMinRow(int minRow) {
        this.minRow = minRow;
    }

    public int getMaxRow() {
        return maxRow;
    }

    public void setMaxRow(int maxRow) {
        this.maxRow = maxRow;
    }

    public int getMinCol() {
        return minCol;
    }

    public void setMinCol(int minCol) {
        this.minCol = minCol;
    }

    public int getMaxCol() {
        return maxCol;
    }

    public void setMaxCol(int maxCol) {
        this.maxCol = maxCol;
    }

    public List<BlackboardElement> getElements() {
        return elements;
    }

    public void setElements(List<BlackboardElement> elements) {
        this.elements = elements;
    }
}