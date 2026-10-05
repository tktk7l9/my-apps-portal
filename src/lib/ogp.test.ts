import { describe, expect, it } from "vitest";
import { extractOgImage, isAllowedImageType, isAllowedPageUrl } from "@/lib/ogp";

describe("isAllowedPageUrl", () => {
  const allowed = ["https://skydial.vercel.app", "https://example.workers.dev/app"];

  it("accepts an exact project URL", () => {
    expect(isAllowedPageUrl("https://skydial.vercel.app", allowed)).toBe(true);
  });

  it("rejects any other URL, including internal addresses and look-alikes", () => {
    expect(isAllowedPageUrl("http://169.254.169.254/latest", allowed)).toBe(false);
    expect(isAllowedPageUrl("https://skydial.vercel.app.evil.test", allowed)).toBe(false);
    expect(isAllowedPageUrl("https://example.workers.dev/app/../x", allowed)).toBe(false);
  });
});

describe("extractOgImage", () => {
  const page = "https://site.test/path/";

  it("returns an absolute og:image as is", () => {
    const html = '<meta property="og:image" content="https://cdn.test/a.png">';
    expect(extractOgImage(html, page)).toBe("https://cdn.test/a.png");
  });

  it("resolves a relative og:image against the page URL", () => {
    const html = "<meta content='/og.png' property='og:image'>";
    expect(extractOgImage(html, page)).toBe("https://site.test/og.png");
  });

  it("skips unrelated meta tags and og:image tags without content", () => {
    const html =
      '<meta name="description" content="x"><meta property="og:image">' +
      '<meta property="og:image" content="b.png">';
    expect(extractOgImage(html, page)).toBe("https://site.test/path/b.png");
  });

  it("refuses non-http schemes", () => {
    const html = '<meta property="og:image" content="file:///etc/passwd">';
    expect(extractOgImage(html, page)).toBeNull();
  });

  it("returns null for an unparsable URL", () => {
    const html = '<meta property="og:image" content="http://[bad">';
    expect(extractOgImage(html, page)).toBeNull();
  });

  it("returns null when there is no og:image", () => {
    expect(extractOgImage("<html></html>", page)).toBeNull();
  });
});

describe("isAllowedImageType", () => {
  it("accepts raster image types", () => {
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("Image/JPEG; charset=binary")).toBe(true);
  });

  it("rejects SVG, non-images and a missing type", () => {
    expect(isAllowedImageType("image/svg+xml")).toBe(false);
    expect(isAllowedImageType("text/html")).toBe(false);
    expect(isAllowedImageType(null)).toBe(false);
  });
});
