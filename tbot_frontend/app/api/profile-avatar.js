const DISCORD_CDN = "https://cdn.discordapp.com";

export default async function handler(req, res) {
  const discordId = String(req.query?.discord_id || "").trim();
  const avatar = String(req.query?.avatar || "").trim();
  const format = String(req.query?.format || "").trim().toLowerCase();

  if (!/^\d{15,25}$/.test(discordId)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Invalid Discord user ID");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(avatar)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Invalid Discord avatar");
  }

  const extension =
    format === "gif" || avatar.startsWith("a_") ? "gif" : "png";

  const discordUrl =
    `${DISCORD_CDN}/avatars/` +
    `${discordId}/` +
    `${avatar}.${extension}?size=1024`;

  try {
    const response = await fetch(discordUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 Tbot Profile Image Proxy",
      },
    });

    if (!response.ok) {
      res.statusCode = response.status;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("Discord avatar unavailable");
    }

    const contentType =
      response.headers.get("content-type") ||
      (extension === "gif" ? "image/gif" : "image/png");

    const buffer = Buffer.from(await response.arrayBuffer());

    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    );
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.end(buffer);
  } catch (error) {
    console.error("Discord avatar proxy failed:", error);

    res.statusCode = 502;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Unable to retrieve Discord avatar");
  }
}