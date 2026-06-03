import { MetadataRoute } from "next";

const BASE_URL = "https://kubeforge.kartikeytripathi.in";

const LAB_IDS = [
  "a1","a2","a3","a4","a5","a6","a7","a8",
  "b1","b2","b3","b4","b5","b6","b7","b8","b9","b10",
  "c1","c2","c3","c4","c5","c6","c7","c8","c9","c10",
  "d1","d2","d3","d4","d5","d6","d7","d8","d9","d10","d11","d12","d13",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                     priority: 1.0,  changeFrequency: "weekly"  },
    { url: `${BASE_URL}/curriculum`,     priority: 0.9,  changeFrequency: "weekly"  },
    { url: `${BASE_URL}/progress`,       priority: 0.5,  changeFrequency: "monthly" },
    { url: `${BASE_URL}/settings`,       priority: 0.3,  changeFrequency: "monthly" },
    { url: `${BASE_URL}/privacy`,        priority: 0.2,  changeFrequency: "yearly"  },
    { url: `${BASE_URL}/tos`,           priority: 0.2,  changeFrequency: "yearly"  },
  ];

  const labRoutes: MetadataRoute.Sitemap = LAB_IDS.map((id) => ({
    url: `${BASE_URL}/lesson/${id}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...labRoutes];
}
