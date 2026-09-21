package com.twinchainstudios.ourkanban.service.domain;


import com.twinchainstudios.ourkanban.dto.domain.projects.Blackboard.LinkPreviewDto;
import com.twinchainstudios.ourkanban.exception.ForbiddenOperationException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LinkPreviewService {

    private static final Duration CACHE_TTL = Duration.ofHours(1);
    private static final Duration FETCH_TIMEOUT = Duration.ofSeconds(6);
    private static final int MAX_BYTES = 500_000; // don't download more than ~500KB of HTML

    private final Map<String, CachedEntry> cache = new ConcurrentHashMap<>();

    private record CachedEntry(LinkPreviewDto dto, Instant expiresAt) {}

    public LinkPreviewDto fetchPreview(String rawUrl) {
        CachedEntry cached = cache.get(rawUrl);
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.dto();
        }

        URI uri = validateAndParse(rawUrl);
        LinkPreviewDto dto = scrape(uri);
        cache.put(rawUrl, new CachedEntry(dto, Instant.now().plus(CACHE_TTL)));
        return dto;
    }

    private URI validateAndParse(String rawUrl) {
        URI uri;
        try {
            uri = new URI(rawUrl);
        } catch (URISyntaxException e) {
            throw new ForbiddenOperationException("Not a valid URL");
        }

        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new ForbiddenOperationException("Only http/https links are supported");
        }

        String host = uri.getHost();
        if (host == null) {
            throw new ForbiddenOperationException("Not a valid URL");
        }

        // Basic SSRF guard: refuse to let the backend fetch anything resolving to a
        // private, loopback, or link-local address (this also covers cloud metadata
        // endpoints like 169.254.169.254). Without this, "paste a link" is a
        // ready-made way to probe or hit internal services from the server itself.
        try {
            InetAddress resolved = InetAddress.getByName(host);
            if (resolved.isLoopbackAddress() || resolved.isSiteLocalAddress()
                    || resolved.isLinkLocalAddress() || resolved.isAnyLocalAddress()) {
                throw new ForbiddenOperationException("That URL can't be previewed");
            }
        } catch (UnknownHostException e) {
            throw new ForbiddenOperationException("Could not resolve that URL");
        }

        return uri;
    }

    private LinkPreviewDto scrape(URI uri) {
        Document doc;
        try {
            doc = Jsoup.connect(uri.toString())
                    .timeout((int) FETCH_TIMEOUT.toMillis())
                    .maxBodySize(MAX_BYTES)
                    .userAgent("Mozilla/5.0 (compatible; OurKanbanLinkPreview/1.0)")
                    .followRedirects(true)
                    .get();
        } catch (IOException e) {
            throw new ForbiddenOperationException("Could not load a preview for that link");
        }

        String title = firstNonBlank(metaContent(doc, "og:title"), doc.title());
        String description = firstNonBlank(metaContent(doc, "og:description"), metaNameContent(doc, "description"));
        String image = metaContent(doc, "og:image");
        String siteName = firstNonBlank(metaContent(doc, "og:site_name"), uri.getHost());

        // Relative image URLs are common — resolve against the actual response URL
        // (post-redirect), which Jsoup exposes via doc.baseUri().
        if (image != null && !image.isBlank() && doc.baseUri() != null) {
            image = URI.create(doc.baseUri()).resolve(image).toString();
        }

        return new LinkPreviewDto(title, description, image, siteName, uri.toString());
    }

    private String metaContent(Document doc, String property) {
        var el = doc.selectFirst("meta[property=" + property + "]");
        return el != null ? el.attr("content") : null;
    }

    private String metaNameContent(Document doc, String name) {
        var el = doc.selectFirst("meta[name=" + name + "]");
        return el != null ? el.attr("content") : null;
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}