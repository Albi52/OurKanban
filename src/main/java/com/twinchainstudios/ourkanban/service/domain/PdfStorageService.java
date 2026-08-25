package com.twinchainstudios.ourkanban.service.domain;

import com.twinchainstudios.ourkanban.exception.ForbiddenOperationException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;

@Service
public class PdfStorageService {

    private static final int THUMBNAIL_DPI = 100;

    @Value("${app.upload-dir-blackboard}")
    private String uploadDir;

    public record StoredPdf(String pdfUrl, String thumbnailUrl, String originalFileName) {}

    public StoredPdf store(MultipartFile file, Long elementId) {
        if (!looksLikePdf(file)) {
            throw new ForbiddenOperationException("File is not a valid PDF");
        }

        deleteExisting(elementId);

        String pdfFilename = elementId + "-" + System.currentTimeMillis() + ".pdf";
        Path pdfPath = Path.of(uploadDir, pdfFilename);

        try {
            Files.createDirectories(pdfPath.getParent());
            file.transferTo(pdfPath);
        } catch (IOException e) {
            throw new ForbiddenOperationException("Failed to save PDF");
        }

        String thumbnailUrl = renderThumbnail(pdfPath, elementId);

        return new StoredPdf(
                "/uploads/blackboard/" + pdfFilename,
                thumbnailUrl,
                file.getOriginalFilename()
        );
    }

    public void delete(Long elementId) {
        deleteExisting(elementId);
    }

    private boolean looksLikePdf(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(5);
            return header.length == 5 && new String(header).equals("%PDF-");
        } catch (IOException e) {
            return false;
        }
    }

    private String renderThumbnail(Path pdfPath, Long elementId) {
        try (PDDocument document = Loader.loadPDF(pdfPath.toFile())) {
            if (document.getNumberOfPages() == 0) {
                return null;
            }
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage page = renderer.renderImageWithDPI(0, THUMBNAIL_DPI, ImageType.RGB);

            String thumbFilename = elementId + "-" + System.currentTimeMillis() + "-thumb.jpg";
            Path thumbPath = Path.of(uploadDir, thumbFilename);
            writeJpeg(page, thumbPath.toFile(), 0.8f);

            return "/uploads/blackboard/" + thumbFilename;
        } catch (Exception e) {
            // A thumbnail failing to render (corrupt/encrypted/unusual PDF) shouldn't
            // block the upload itself — the element just falls back to a plain
            // filename card with no visual preview.
            return null;
        }
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

    private void deleteExisting(Long elementId) {
        File dir = new File(uploadDir);
        File[] matches = dir.listFiles((d, name) -> name.startsWith(elementId + "-"));
        if (matches != null) {
            for (File f : matches) {
                f.delete();
            }
        }
    }
}