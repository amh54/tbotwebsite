import { rewrite } from "@vercel/edge";

export const config = {
  // match everything except static assets and the api routes themselves
  matcher:
    "/((?!api/|.*\\.(?:ico|png|jpg|jpeg|svg|webp|css|js|map|woff2?)$).*)",
};

const BOT_UA_REGEX =
  /(discordbot|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|pinterest|redditbot)/i;

export default function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  const url = new URL(request.url);

  const hasShareableTarget =
    url.pathname.startsWith("/deck/") ||
    url.searchParams.has("deck") ||
    url.searchParams.has("card");

  if (BOT_UA_REGEX.test(ua) && hasShareableTarget) {
    const target = new URL("/api/deck-og", url.origin);
    target.searchParams.set("path", url.pathname + url.search);
    return rewrite(target);
  }
}
