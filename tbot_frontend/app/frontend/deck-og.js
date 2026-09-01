const API = process.env.DJANGO_API_URL; // server-side only, not VITE_-prefixed

export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) return notFound(res);

  const url = new URL(path, "https://placeholder.local"); // just to parse path/search safely
  const pathname = url.pathname;
  const deckKey = url.searchParams.get("deck"); // e.g. "some-deck-name-123"

  let deck = null;

  // Case 1: /deck/{slug}/{key} — dedicated single-deck endpoint
  const pathMatch = /^\/deck\/([^/]+)\/([^/]+)$/.exec(pathname);
  if (pathMatch) {
    const [, slug, key] = pathMatch;
    const deckId = /-(\d+)$/.exec(key)?.[1];
    if (deckId) {
      const r = await fetch(`${API}/tbotapp/user-decks/shared/${encodeURIComponent(slug)}/${deckId}/`);
      if (r.ok) deck = await r.json();
    }
  }
  // Case 2: /profile/{slug}?deck={key} — list + find
  else if (pathname.startsWith("/profile/") && deckKey) {
    const slug = pathname.split("/")[2];
    const r = await fetch(`${API}/tbotapp/profile/${encodeURIComponent(slug)}/decks/`);
    if (r.ok) deck = findDeckInList(await r.json(), deckKey);
  }
  // Case 3: decklists / legacy-decklists / deckbuilders/{name} ?deck={key}
  else if (deckKey) {
    let listUrl = null;
    if (pathname === "/decklists") listUrl = `${API}/tbotapp/decklists/`;
    else if (pathname === "/legacy-decklists") listUrl = `${API}/tbotapp/legacy-decklists/`;
    else {
      const dbMatch = /^\/deckbuilders\/([^/]+)/.exec(pathname);
      if (dbMatch) listUrl = `${API}/tbotapp/deckbuilders/${encodeURIComponent(dbMatch[1])}/decks/`;
    }
    if (listUrl) {
      const r = await fetch(listUrl);
      if (r.ok) deck = findDeckInList(await r.json(), deckKey);
    }
  }

  if (!deck) return notFound(res);

  const imageUrl = resolveImageUrl(deck.image);

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="${escapeHtml(deck.name)} — TBOT Deck" />
  <meta property="og:description" content="${escapeHtml(deck.description || "A Plants vs. Zombies Heroes deck")}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(path)}" />
</head>
<body>Redirecting…</body>
</html>`);
}

function findDeckInList(payload, deckKey) {
  const list = Array.isArray(payload) ? payload : payload?.results || payload?.decks || [];
  const wanted = deckKey.toLowerCase();
  return (
    list.find((d) => {
      const id = String(d.deckid ?? d.deckID ?? d.deckId ?? d.id ?? "").trim();
      const name = String(d.name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const key = name ? `${name}-${id}` : id;
      return wanted === key.toLowerCase() || wanted === id.toLowerCase();
    }) || null
  );
}

function resolveImageUrl(image) {
  const img = String(image || "").trim();
  if (!img) return "";
  if (/^https?:\/\/|^data:|^blob:/i.test(img)) return img;
  return `${API}${img.startsWith("/") ? "" : "/"}${img}`;
}

function notFound(res) {
  res.status(404).send("Not found");
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}