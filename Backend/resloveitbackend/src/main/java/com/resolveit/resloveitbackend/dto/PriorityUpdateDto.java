package com.resolveit.resloveitbackend.dto;

public class PriorityUpdateDto {

    private String priority;

    public PriorityUpdateDto() {
    }

    public PriorityUpdateDto(String priority) {
        this.priority = priority;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
