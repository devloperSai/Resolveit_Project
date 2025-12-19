package com.resolveit.resloveitbackend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
@Slf4j
public class FileController {

    private static final String COMPLAINTS_UPLOAD_DIR = System.getProperty("user.dir") + File.separator + "uploads" + File.separator + "complaints" + File.separator;
    private static final String OFFICERS_UPLOAD_DIR = System.getProperty("user.dir") + File.separator + "uploads" + File.separator + "officers" + File.separator;

    /**
     * ✅ Debug endpoint - List all complaint files
     */
    @GetMapping("/debug/complaints")
    public ResponseEntity<?> listComplaintFiles() {
        try {
            File dir = new File(COMPLAINTS_UPLOAD_DIR);
            List<String> files = new ArrayList<>();
            
            if (dir.exists() && dir.isDirectory()) {
                File[] fileList = dir.listFiles();
                if (fileList != null) {
                    for (File f : fileList) {
                        if (f.isFile()) {
                            files.add(f.getName());
                        }
                    }
                }
            }
            
            log.info("Available complaint files: {}", files);
            return ResponseEntity.ok()
                    .body(new FileListResponse(COMPLAINTS_UPLOAD_DIR, files));
        } catch (Exception e) {
            log.error("Error listing complaint files", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error listing files: " + e.getMessage());
        }
    }

    /**
     * ✅ Serve complaint attachment files
     */
    @GetMapping("/complaints/{filename}")
    public ResponseEntity<?> getComplaintFile(@PathVariable String filename) {
        try {
            return serveFile(filename, COMPLAINTS_UPLOAD_DIR, "complaint attachment");
        } catch (Exception e) {
            log.error("Error serving complaint file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("Access-Control-Allow-Origin", "*")
                    .body("Error serving file: " + e.getMessage());
        }
    }

    /**
     * ✅ Serve officer profile files
     */
    @GetMapping("/officers/{filename}")
    public ResponseEntity<?> getOfficerFile(@PathVariable String filename) {
        try {
            return serveFile(filename, OFFICERS_UPLOAD_DIR, "officer file");
        } catch (Exception e) {
            log.error("Error serving officer file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("Access-Control-Allow-Origin", "*")
                    .body("Error serving file: " + e.getMessage());
        }
    }

    /**
     * ✅ Handle CORS preflight requests for complaints
     */
    @RequestMapping(value = "/complaints/{filename}", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleComplaintOptions() {
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }

    /**
     * ✅ Handle CORS preflight requests for officers
     */
    @RequestMapping(value = "/officers/{filename}", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOfficerOptions() {
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }

    /**
     * ✅ Generic file serving with security checks
     */
    private ResponseEntity<?> serveFile(String filename, String baseDir, String fileType) throws Exception {
        log.info("Attempting to serve {} file: {}", fileType, filename);
        log.info("Base directory: {}", baseDir);

        // Validate filename - prevent directory traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            log.warn("Security violation attempt: Invalid filename format - {}", filename);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .header("Access-Control-Allow-Origin", "*")
                    .body("Invalid filename format");
        }

        Path filePath = Paths.get(baseDir).resolve(filename).normalize();
        Path basePath = Paths.get(baseDir).normalize();

        // Ensure file is within base directory
        if (!filePath.startsWith(basePath)) {
            log.warn("Security violation: Attempted directory traversal for {}", filename);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .header("Access-Control-Allow-Origin", "*")
                    .body("Access denied");
        }

        // Check if file exists
        if (!Files.exists(filePath)) {
            log.warn("File not found: {} at path: {}", filename, filePath.toString());
            
            // List available files for debugging
            File dir = new File(baseDir);
            if (dir.exists()) {
                File[] files = dir.listFiles();
                if (files != null && files.length > 0) {
                    log.warn("Available files in {}: ", baseDir);
                    StringBuilder sb = new StringBuilder();
                    for (File f : files) {
                        log.warn("  - {}", f.getName());
                        sb.append(f.getName()).append(", ");
                    }
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .header("Access-Control-Allow-Origin", "*")
                            .body("File not found: " + filename + ". Available files: " + sb.toString());
                } else {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .header("Access-Control-Allow-Origin", "*")
                            .body("File not found: " + filename + ". No files in directory.");
                }
            }
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .header("Access-Control-Allow-Origin", "*")
                    .body("File not found: " + filename);
        }

        // Check if file is readable
        if (!Files.isReadable(filePath)) {
            log.error("File not readable: {}", filePath.toString());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .header("Access-Control-Allow-Origin", "*")
                    .body("File is not readable");
        }

        // Determine content type
        String contentType = determineContentType(filename);
        log.info("Serving file {} with content type: {}", filename, contentType);

        try {
            Resource resource = new UrlResource(filePath.toUri());

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .header("Cache-Control", "no-cache, no-store, must-revalidate")
                    .header("Pragma", "no-cache")
                    .header("Expires", "0")
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .header("Access-Control-Max-Age", "3600")
                    .body(resource);
        } catch (Exception e) {
            log.error("Error creating resource for file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("Access-Control-Allow-Origin", "*")
                    .body("Error reading file: " + e.getMessage());
        }
    }

    /**
     * ✅ Determine appropriate content type based on file extension
     */
    private String determineContentType(String filename) {
        String lowerFilename = filename.toLowerCase();

        if (lowerFilename.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerFilename.endsWith(".png")) {
            return "image/png";
        } else if (lowerFilename.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerFilename.endsWith(".webp")) {
            return "image/webp";
        } else if (lowerFilename.endsWith(".txt")) {
            return "text/plain";
        } else if (lowerFilename.endsWith(".doc") || lowerFilename.endsWith(".docx")) {
            return "application/msword";
        } else {
            return "application/octet-stream";
        }
    }

    /**
     * Simple response class for file list
     */
    public static class FileListResponse {
        public String baseDir;
        public List<String> files;

        public FileListResponse(String baseDir, List<String> files) {
            this.baseDir = baseDir;
            this.files = files;
        }

        public String getBaseDir() {
            return baseDir;
        }

        public List<String> getFiles() {
            return files;
        }
    }
}
