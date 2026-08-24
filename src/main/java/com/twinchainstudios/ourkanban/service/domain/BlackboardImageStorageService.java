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

@Service
public class BlackboardImageStorageService {

    private static final int MAX_DIMENSION = 16000;

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
            // Also hit for formats ImageIO has no reader for out of the box —
            // notably WebP, which needs an extra plugin (see note below).
            throw new ForbiddenOperationException("File is not a valid image, or its format isn't supported");
        }

        boolean hasAlpha = original.getColorModel().hasAlpha();
        BufferedImage resized = resizeIfLarger(original, MAX_DIMENSION, hasAlpha);

        deleteExisting(elementId);

        String extension = hasAlpha ? "png" : "jpg";
        String filename = elementId + "-" + System.currentTimeMillis() + "." + extension;
        Path targetPath = Path.of(uploadDir, filename);

        try {
            Files.createDirectories(targetPath.getParent());
            writeImage(resized, targetPath.toFile(), hasAlpha);
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

    private BufferedImage resizeIfLarger(BufferedImage img, int maxDimension, boolean hasAlpha) {
        int width = img.getWidth();
        int height = img.getHeight();
        int longestEdge = Math.max(width, height);

        // Even when no resize is needed, re-draw into a canonical ARGB/RGB
        // buffer so downstream writing behaves consistently regardless of
        // the source image's original color model (e.g. indexed PNGs).
        int targetWidth = width;
        int targetHeight = height;
        if (longestEdge > maxDimension) {
            double scale = (double) maxDimension / longestEdge;
            targetWidth = (int) Math.round(width * scale);
            targetHeight = (int) Math.round(height * scale);
        }

        int imageType = hasAlpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, imageType);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(img, 0, 0, targetWidth, targetHeight, null);
        g.dispose();
        return resized;
    }

    private void writeImage(BufferedImage image, File output, boolean hasAlpha) throws IOException {
        String format = hasAlpha ? "png" : "jpg";
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(format);
        ImageWriter writer = writers.next();

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(ios);

            if (hasAlpha) {
                // PNG is lossless — no compression-quality param to set.
                writer.write(image);
            } else {
                ImageWriteParam param = writer.getDefaultWriteParam();
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(0.85f);
                writer.write(null, new IIOImage(image, null, null), param);
            }
        } finally {
            writer.dispose();
        }
    }
}