package com.twinchainstudios.ourkanban.service.domain;

import com.twinchainstudios.ourkanban.exception.ForbiddenOperationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;

// Mirrors ImageStorageService's structure, but doesn't crop to a square —
// blackboard elements can be any rectangle, so cropping would destroy
// arbitrary aspect ratios. Images are only ever downscaled (never enlarged)
// if they exceed MAX_DIMENSION on their longest edge.
@Service
public class BlackboardImageStorageService {

    private static final int MAX_DIMENSION = 1600;

    @Value("${app.upload-dir-blackboard}")
    private String uploadDir;

    public String store(MultipartFile file, Long elementId) {
        BufferedImage original;
        try {
            original = ImageIO.read(file.getInputStream());
        } catch (IOException e) {
            throw new ForbiddenOperationException("Could not read uploaded file");
        }

        if (original == null) {
            throw new ForbiddenOperationException("File is not a valid image");
        }

        BufferedImage resized = resizeIfLarger(original, MAX_DIMENSION);

        deleteExisting(elementId);

        String filename = elementId + "-" + System.currentTimeMillis() + ".jpg";
        Path targetPath = Path.of(uploadDir, filename);

        try {
            Files.createDirectories(targetPath.getParent());
            writeJpeg(resized, targetPath.toFile(), 0.85f);
        } catch (IOException e) {
            throw new ForbiddenOperationException("Failed to save image");
        }

        return "/uploads/blackboard/" + filename;
    }

    public void delete(Long elementId) {
        deleteExisting(elementId);
    }

    private void deleteExisting(Long elementId) {
        File dir = new File(uploadDir);
        File[] matches = dir.listFiles((d, name) -> name.startsWith(elementId + "-"));
        if (matches != null) {
            for (File f : matches) {
                f.delete();
            }
        }
    }

    private BufferedImage resizeIfLarger(BufferedImage img, int maxDimension) {
        int width = img.getWidth();
        int height = img.getHeight();
        int longestEdge = Math.max(width, height);

        if (longestEdge <= maxDimension) {
            return img;
        }

        double scale = (double) maxDimension / longestEdge;
        int targetWidth = (int) Math.round(width * scale);
        int targetHeight = (int) Math.round(height * scale);

        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(img, 0, 0, targetWidth, targetHeight, null);
        g.dispose();
        return resized;
    }

    private void writeJpeg(BufferedImage image, File output, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
    }
}