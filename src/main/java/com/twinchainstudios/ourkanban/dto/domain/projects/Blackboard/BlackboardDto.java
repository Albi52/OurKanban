package com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard;

import com.twinchainstudios.ourkanban.model.domain.Blackboard;

import java.util.List;
import java.util.stream.Collectors;

public class BlackboardDto {
    public Long id;
    public int minRow;
    public int maxRow;
    public int minCol;
    public int maxCol;
    public List<BlackboardElementDto> elements;

    public static BlackboardDto from(Blackboard board) {
        BlackboardDto dto = new BlackboardDto();
        dto.id = board.getId();
        dto.minRow = board.getMinRow();
        dto.maxRow = board.getMaxRow();
        dto.minCol = board.getMinCol();
        dto.maxCol = board.getMaxCol();
        dto.elements = board.getElements().stream()
                .map(BlackboardElementDto::from)
                .collect(Collectors.toList());
        return dto;
    }
}