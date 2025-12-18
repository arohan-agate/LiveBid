package com.livebid.image.controller;

import com.livebid.image.service.ImageService;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/images")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    /**
     * Generate a pre-signed URL for uploading an image.
     * The client will use this URL to upload directly to S3.
     */
    @PostMapping("/upload-url")
    public Map<String, String> getUploadUrl(@RequestBody UploadUrlRequest request) {
        // Generate a unique key: auctions/{uuid}/{filename}
        String key = "auctions/" + UUID.randomUUID() + "/" + sanitizeFilename(request.getFilename());

        String uploadUrl = imageService.generateUploadUrl(key, request.getContentType());

        return Map.of(
                "uploadUrl", uploadUrl,
                "key", key,
                "viewUrl", imageService.getImageUrl(key));
    }

    /**
     * Sanitize filename to prevent path traversal attacks.
     */
    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "image.jpg";
        }
        // Remove any path components and keep only the filename
        String sanitized = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        return sanitized.isEmpty() ? "image.jpg" : sanitized;
    }

    @Data
    public static class UploadUrlRequest {
        private String filename;
        private String contentType;
    }
}
