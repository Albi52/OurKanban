package com.twinchainstudios.ourkanban.service.auth;

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
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;

@Service
public class ImageStorageService {

    private static final int TARGET_SIZE = 360;

    @Value("${app.upload-dir}")
    private String uploadDir;

    /** Crops to square, resizes to 360x360, saves as JPEG, and returns the public URL path. */
    public String store(MultipartFile file, Long userId) {
        BufferedImage original;
        try {
            original = ImageIO.read(file.getInputStream());
        } catch (IOException e) {
            throw new ForbiddenOperationException("Could not read uploaded file");
        }

        if (original == null) {
            throw new ForbiddenOperationException("File is not a valid image");
        }

        BufferedImage squared = cropToSquare(original);
        BufferedImage resized = resize(squared, TARGET_SIZE);

        deleteExisting(userId);

        String filename = userId + "-" + System.currentTimeMillis() + ".jpg";
        Path targetPath = Path.of(uploadDir, filename);

        try {
            Files.createDirectories(targetPath.getParent());
            writeJpeg(resized, targetPath.toFile(), 0.85f);
        } catch (IOException e) {
            throw new ForbiddenOperationException("Failed to save image");
        }

        return "/uploads/avatars/" + filename;
    }

    public void delete(Long userId) {
        deleteExisting(userId);
    }

    private void deleteExisting(Long userId) {
        File dir = new File(uploadDir);
        File[] matches = dir.listFiles((d, name) -> name.startsWith(userId + "-"));
        if (matches != null) {
            for (File f : matches) {
                f.delete();
            }
        }
    }

    private BufferedImage cropToSquare(BufferedImage img) {
        int size = Math.min(img.getWidth(), img.getHeight());
        int x = (img.getWidth() - size) / 2;
        int y = (img.getHeight() - size) / 2;
        return img.getSubimage(x, y, size, size);
    }

    private BufferedImage resize(BufferedImage img, int targetSize) {
        BufferedImage resized = new BufferedImage(targetSize, targetSize, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(img, 0, 0, targetSize, targetSize, null);
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

    public String storeFromUrl(String imageUrl, Long userId) {
    BufferedImage original;
    try (InputStream in = new URI(imageUrl).toURL().openStream()) {
        original = ImageIO.read(in);
    } catch (Exception e) {
        throw new ForbiddenOperationException("Could not fetch image from URL");
    }

    if (original == null) {
        throw new ForbiddenOperationException("URL did not return a valid image");
    }

    BufferedImage squared = cropToSquare(original);
    BufferedImage resized = resize(squared, TARGET_SIZE);

    deleteExisting(userId);

    String filename = userId + "-" + System.currentTimeMillis() + ".jpg";
    Path targetPath = Path.of(uploadDir, filename);

    try {
        Files.createDirectories(targetPath.getParent());
        writeJpeg(resized, targetPath.toFile(), 0.85f);
    } catch (IOException e) {
        throw new ForbiddenOperationException("Failed to save image");
    }

    return "/uploads/avatars/" + filename;
}
}