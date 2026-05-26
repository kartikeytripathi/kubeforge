import { MetadataRoute } from "next";

const BASE_URL = "https://kubeforge.kartikeytripathi.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/progress", "/settings"] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
