import type { APIRoute } from "astro";
import { PUBLIC_PATHS, publicPageUrl } from "../lib/seo";

export const GET: APIRoute = () => {
  const entries = PUBLIC_PATHS.map((path) => `<url><loc>${publicPageUrl(path)}</loc></url>`).join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
