import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Library Hop Checklist",
    short_name: "Library Hop",
    description: "Track your UP Diliman Library Hop stamps and visits.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdfaf6",
    theme_color: "#7b1113",
    icons: [
      {
        src: "/next.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
