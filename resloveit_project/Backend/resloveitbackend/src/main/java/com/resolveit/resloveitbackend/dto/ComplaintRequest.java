package com.resolveit.resloveitbackend.dto;

public class ComplaintRequest {
    private String title;
    private String description;
    private String category;
    private boolean isAnonymous;

    // Getters & Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(boolean isAnonymous) { this.isAnonymous = isAnonymous; }
}
