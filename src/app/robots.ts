import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// /api/og/*.png are the eyecatch images referenced by og:image, so nothing is disallowed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
