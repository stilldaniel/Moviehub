import type { MetadataRoute } from "next";

// Lets people add Zora Stream to their home screen like an app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zora Stream",
    short_name: "Zora",
    description: "Movies, TV shows, anime, free classics and live sports in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#0b0b0b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
