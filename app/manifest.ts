import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Astral Warp Archive",
    short_name: "Warp Archive",
    description:
      "Track warps, wishes, signals, supplies, and convenes across your gacha games. Forecast your next five-star and climb the global luck leaderboard.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0e1a",
    theme_color: "#0c0e1a",
    categories: ["games", "utilities", "productivity"],
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      {
        name: "Quick Log",
        short_name: "Quick Log",
        description: "Log a pull in seconds",
        url: "/quick-log",
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard",
      },
    ],
  }
}
