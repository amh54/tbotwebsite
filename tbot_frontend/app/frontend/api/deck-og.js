const API = process.env.DJANGO_API_URL; // server-side only, not VITE_-prefixed

// ---------- shared helpers ----------

function resolveImageUrl(image) {
  const img = String(image || "").trim();

  if (!img) return "";

  if (/^https?:\/\/|^data:|^blob:/i.test(img)) return img;

  return `${API}${img.startsWith("/") ? "" : "/"}${img}`;
}

function escapeHtml(str) {
  return String(str || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

const normalizeText = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

function stripDiscordFormatting(value) {
  return String(value ?? "")
    .replace(/<a?:([^:>]+):\d+>/gi, " $1 ")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max = 500) {
  const clean = String(text || "");

  return clean.length > max
    ? `${clean.slice(0, max).trimEnd()}…`
    : clean;
}

function findDeckInList(payload, deckKey) {
  const list = Array.isArray(payload)
    ? payload
    : payload?.results || payload?.decks || [];

  const wanted = String(deckKey || "").toLowerCase();

  return (
    list.find((d) => {
      const id = String(
        d.deckid ??
          d.deckID ??
          d.deckId ??
          d.id ??
          "",
      ).trim();

      const name = String(d.name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const key = name ? `${name}-${id}` : id;

      return (
        wanted === key.toLowerCase() ||
        wanted === id.toLowerCase()
      );
    }) || null
  );
}

function deckToOg(deck) {
  if (!deck) return null;

  const parts = [];

  const creator = stripDiscordFormatting(
    deck.creator ||
      deck.creator_name ||
      deck.created_by ||
      deck.owner ||
      "",
  );

  const category = stripDiscordFormatting(deck.category);
  const archetype = stripDiscordFormatting(deck.archetype);
  const description = stripDiscordFormatting(deck.description);

  // Most important deck information comes first.
  if (creator) {
    parts.push(`Creator: ${creator}`);
  }

  if (category) {
    parts.push(`Category: ${category}`);
  }

  if (archetype) {
    parts.push(`Archetype: ${archetype}`);
  }

  // Description is intentionally last because it is
  // less important than the deck's identifying information.
  if (description) {
    parts.push(description);
  }

  return {
    title: `${deck.name || "Untitled Deck"} — TBOT Deck`,
    description: truncate(
      parts.join(" • ") ||
        "A Plants vs. Zombies Heroes deck",
      500,
    ),
    image: resolveImageUrl(deck.image),
  };
}

// ---------- card helpers ----------

function findCardInList(payload, cardQuery) {
  const list = Array.isArray(payload)
    ? payload
    : payload?.results || payload?.cards || [];

  const wanted = normalizeText(cardQuery);

  return (
    list.find((card) => {
      const cardName = normalizeText(card.card_name);

      const title = normalizeText(
        stripDiscordFormatting(card.title),
      );

      const aliases = normalizeText(card.aliases)
        .split(/[,|;]/)
        .map((a) => a.trim());

      return (
        cardName === wanted ||
        title === wanted ||
        aliases.includes(wanted)
      );
    }) || null
  );
}

function cardToOg(card) {
  if (!card) return null;

  const name =
    stripDiscordFormatting(card.title) ||
    card.card_name ||
    "Unknown Card";

  const parts = [];

  // Card type
  if (card.card_type) {
    parts.push(
      `Type: ${stripDiscordFormatting(card.card_type)}`,
    );
  }

  // Plant/Zombie side
  if (card.side) {
    parts.push(
      `Side: ${stripDiscordFormatting(card.side)}`,
    );
  }

  // Cost + attack + health, already supplied by the API
  // in the stats field.
  if (card.stats) {
    parts.push(
      `Stats: ${stripDiscordFormatting(card.stats)}`,
    );
  }

  // Card description / classification.
  if (card.description) {
    parts.push(
      `Description: ${stripDiscordFormatting(card.description)}`,
    );
  }

  // Ability, when present.
  if (card.ability) {
    parts.push(
      `Ability: ${stripDiscordFormatting(card.ability)}`,
    );
  }

  // Traits, when present.
  if (card.traits) {
    parts.push(
      `Traits: ${stripDiscordFormatting(card.traits)}`,
    );
  }

  // Set and rarity.
  if (card.set_rarity) {
    parts.push(
      `Set/Rarity: ${stripDiscordFormatting(card.set_rarity)}`,
    );
  }

  // flavor_text is intentionally NOT included.
  //
  // aliases, button, button_emoji, button2, and button_emoji2
  // are also intentionally NOT included.

  return {
    title: `${name} — TBOT Card Info`,
    description: truncate(
      parts.join(" • ") ||
        "A Plants vs. Zombies Heroes card",
      500,
    ),
    image: resolveImageUrl(card.thumbnail),
  };
}

// ---------- resolvers, tried in order ----------

const RESOLVERS = [
  {
    // /deck/{slug}/{key}
    test: (pathname) =>
      /^\/deck\/([^/]+)\/([^/]+)$/.exec(pathname),

    resolve: async (match) => {
      const [, slug, key] = match;

      const deckId = /-(\d+)$/.exec(key)?.[1];

      if (!deckId) return null;

      const r = await fetch(
        `${API}/tbotapp/user-decks/shared/${encodeURIComponent(
          slug,
        )}/${deckId}/`,
      );

      if (!r.ok) return null;

      return deckToOg(await r.json());
    },
  },

  {
    // /profile/{slug}?deck={key}
    test: (pathname, params) =>
      pathname.startsWith("/profile/") &&
      params.has("deck")
        ? [pathname.split("/")[2]]
        : null,

    resolve: async ([slug], params) => {
      const r = await fetch(
        `${API}/tbotapp/profile/${encodeURIComponent(
          slug,
        )}/decks/`,
      );

      if (!r.ok) return null;

      return deckToOg(
        findDeckInList(
          await r.json(),
          params.get("deck"),
        ),
      );
    },
  },

  {
    // /decklists?deck={key}
    // /legacy-decklists?deck={key}
    // /deckbuilders/{name}?deck={key}
    test: (pathname, params) => {
      if (!params.has("deck")) return null;

      if (pathname === "/decklists") {
        return ["decklists"];
      }

      if (pathname === "/legacy-decklists") {
        return ["legacy-decklists"];
      }

      const dbMatch =
        /^\/deckbuilders\/([^/]+)/.exec(pathname);

      if (dbMatch) {
        return ["deckbuilders", dbMatch[1]];
      }

      return null;
    },

    resolve: async (match, params) => {
      const listUrl =
        match[0] === "decklists"
          ? `${API}/tbotapp/decklists/`
          : match[0] === "legacy-decklists"
            ? `${API}/tbotapp/legacy-decklists/`
            : `${API}/tbotapp/deckbuilders/${encodeURIComponent(
                match[1],
              )}/decks/`;

      const r = await fetch(listUrl);

      if (!r.ok) return null;

      return deckToOg(
        findDeckInList(
          await r.json(),
          params.get("deck"),
        ),
      );
    },
  },

  {
    // ANY page ?card={card_name}
    //
    // CardBrowser does not use a dedicated path,
    // so this resolver intentionally works regardless
    // of the current pathname.
    test: (pathname, params) =>
      params.has("card")
        ? [params.get("card")]
        : null,

    resolve: async ([cardQuery]) => {
      const r = await fetch(
        `${API}/tbotapp/cardinfo/`,
      );

      if (!r.ok) return null;

      return cardToOg(
        findCardInList(
          await r.json(),
          cardQuery,
        ),
      );
    },
  },
];

// ---------- handler ----------

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return notFound(res);
  }

  const url = new URL(
    path,
    "https://placeholder.local",
  );

  const pathname = url.pathname;
  const params = url.searchParams;

  let og = null;

  for (const resolver of RESOLVERS) {
    const match = resolver.test(
      pathname,
      params,
    );

    if (!match) continue;

    og = await resolver.resolve(
      match,
      params,
    );

    if (og) break;
  }

  if (!og) {
    return notFound(res);
  }

  res.setHeader(
    "Content-Type",
    "text/html",
  );

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="${escapeHtml(
    og.title,
  )}" />

  <meta property="og:description" content="${escapeHtml(
    og.description,
  )}" />

  <meta property="og:image" content="${escapeHtml(
    og.image,
  )}" />

  <meta property="og:type" content="website" />

  <meta name="twitter:card" content="summary_large_image" />

  <meta http-equiv="refresh" content="0; url=${escapeHtml(
    path,
  )}" />
</head>

<body>
  Redirecting…
</body>
</html>`);
}

function notFound(res) {
  res.status(404).send("Not found");
}