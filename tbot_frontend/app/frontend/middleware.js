import { rewrite } from "@vercel/edge";

export const config = {
  matcher: [
    "/deck/:path*",
    "/profile/:path*",
    "/decklists",
    "/legacy-decklists",
    "/deckbuilders/:path*",
  ],
};

const BOT_UA_REGEX =
  /(discordbot|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|pinterest|redditbot)/i;

export default function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  const url = new URL(request.url);

  const hasDeckTarget =
    url.pathname.startsWith("/deck/") || url.searchParams.has("deck");

  if (BOT_UA_REGEX.test(ua) && hasDeckTarget) {
    const target = new URL("/api/deck-og", url.origin);
    target.searchParams.set("path", url.pathname + url.search);
    return rewrite(target);
  }
}