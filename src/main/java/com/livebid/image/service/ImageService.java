package com.livebid.image.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

@Service
public class ImageService {

    private final S3Presigner presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

    public ImageService(S3Presigner presigner) {
        this.presigner = presigner;
    }

    /**
     * Generate a pre-signed URL for uploading an image to S3.
     * The URL is valid for 5 minutes and allows a direct PUT request from the
     * browser.
     *
     * @param key         The S3 object key (path within bucket)
     * @param contentType The MIME type of the file (e.g., "image/jpeg")
     * @return Pre-signed PUT URL
     */
    public String generateUploadUrl(String key, String contentType) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5))
                .putObjectRequest(putRequest)
                .build();

        return presigner.presignPutObject(presignRequest).url().toString();
    }

    /**
     * Get the public URL for viewing an uploaded image.
     *
     * @param key The S3 object key
     * @return Public S3 URL
     */
    public String getImageUrl(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }
}
