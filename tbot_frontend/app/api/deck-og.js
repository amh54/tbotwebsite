const API = String(process.env.DJANGO_API_URL || "").replace(/\/+$/, "");

const SITE_URL = "https://pvzhtbot.com";

const DEFAULT_IMAGE = "https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp";

const DEFAULT_TITLE = "Tbot — Plants vs. Zombies Heroes";

const DEFAULT_DESCRIPTION =
  "A community database for Plants vs. Zombies Heroes cards, heroes, decks, collections, and strategy.";

const PAGE_METADATA = {
  "/": {
    title: "Tbot — Plants vs. Zombies Heroes",
    description:
      "A community database for Plants vs. Zombies Heroes cards, heroes, decks, collections, and strategy.",
  },
  "/decklists": {
    title: "Decklists — Tbot",
    description:
      "Browse the Tbot Plants vs. Zombies Heroes community deck database.",
  },
  "/cardinfo": {
    title: "Card Information — Tbot",
    description:
      "Search and explore Plants vs. Zombies Heroes cards, abilities, stats, traits, sets, and rarities.",
  },
  "/heroinfo": {
    title: "Hero Information — Tbot",
    description:
      "Explore Plants vs. Zombies Heroes heroes, classes, abilities, traits, stats, and cards.",
  },
  "/keeporscrap": {
    title: "Keep or Scrap — Tbot",
    description:
      "Find recommendations for which Plants vs. Zombies Heroes cards to keep or scrap.",
  },
  "/legacydecks": {
    title: "Legacy Decks — Tbot",
    description:
      "Browse the older Tbot Plants vs. Zombies Heroes deck database.",
  },
  "/deckbuilders": {
    title: "Deckbuilders — Tbot",
    description:
      "Explore Tbot deckbuilders and the decks they have submitted to the community.",
  },
  "/users": {
    title: "Users — Tbot",
    description:
      "Browse Tbot community profiles and discover Plants vs. Zombies Heroes deckbuilders.",
  },
  "/tutorial": {
    title: "Tbot Tutorial",
    description:
      "Learn how to use Tbot to browse cards, heroes, decks, collections, profiles, and other features.",
  },
  "/updates": {
    title: "Site Updates — Tbot",
    description:
      "View the latest updates, improvements, and changes to the Tbot website.",
  },
  "/termsofservice": {
    title: "Terms of Service — Tbot",
    description: "Read the Tbot Terms of Service.",
  },
  "/privacypolicy": {
    title: "Privacy Policy — Tbot",
    description: "Read the Tbot Privacy Policy.",
  },
};

const PRIVATE_ROUTES = [
  "/dashboard",
  "/dashboard/decks",
  "/dashboard/decks/add",
  "/dashboard/card-manager",
  "/admin",
  "/admin/cards",
  "/admin/bugs",
  "/admin/decklists",
  "/admin/decklists/add",
  "/admin/decklist/add",
  "/admin/keeporscrap",
  "/admin/legacy-decks",
  "/admin/user-decks",
  "/my-bug-reports",
];

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

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
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
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

function resolveImageUrl(image) {
  const img = String(image || "").trim();

  if (!img) {
    return DEFAULT_IMAGE;
  }

  if (/^(https?:\/\/|data:|blob:)/i.test(img)) {
    return img;
  }

  if (!API) {
    return img;
  }

  return `${API}${img.startsWith("/") ? "" : "/"}${img}`;
}
function resolveDiscordAvatar(profile) {
  const avatar = String(profile?.avatar || "").trim();
  const discordId = String(profile?.discord_id || "").trim();

  if (!avatar || !discordId) {
    return "";
  }

  const extension = avatar.startsWith("a_") ? "gif" : "png";

  return (
    `${SITE_URL}/api/profile-avatar` +
    `?discord_id=${encodeURIComponent(discordId)}` +
    `&avatar=${encodeURIComponent(avatar)}` +
    `&format=${extension}`
  );
}
function resolveProfileImage(profile) {
  const image = String(
    profile?.avatar_url ||
      profile?.avatarUrl ||
      profile?.profile_image ||
      profile?.profileImage ||
      profile?.image ||
      "",
  ).trim();

  if (image) {
    return resolveImageUrl(image);
  }

  return resolveDiscordAvatar(profile);
}

function findDeckInList(payload, deckKey) {
  const list = Array.isArray(payload)
    ? payload
    : payload?.results || payload?.decks || [];

  const wanted = String(deckKey || "")
    .trim()
    .toLowerCase();

  if (!wanted) {
    return null;
  }

  return (
    list.find((deck) => {
      const id = String(
        deck.deckid ?? deck.deckID ?? deck.deckId ?? deck.id ?? "",
      ).trim();

      const name = String(deck.name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const key = name ? `${name}-${id}` : id;

      return wanted === key.toLowerCase() || wanted === id.toLowerCase();
    }) || null
  );
}

function deckToOg(deck) {
  if (!deck) {
    return null;
  }

  const parts = [];

  const creator = stripDiscordFormatting(
    deck.creator || deck.creator_name || deck.created_by || deck.owner || "",
  );

  const category = stripDiscordFormatting(deck.category);
  const archetype = stripDiscordFormatting(deck.archetype);
  const description = stripDiscordFormatting(deck.description);

  if (creator) {
    parts.push(`Creator: ${creator}`);
  }

  if (category) {
    parts.push(`Category: ${category}`);
  }

  if (archetype) {
    parts.push(`Archetype: ${archetype}`);
  }

  if (description) {
    parts.push(description);
  }

  return {
    title: `${deck.name || "Untitled Deck"} — TBOT Deck`,
    description:
      truncate(parts.join("\n"), 500) ||
      "View this Plants vs. Zombies Heroes deck on Tbot.",
    image: resolveImageUrl(deck.image),
  };
}

function findCardInList(payload, cardQuery) {
  const list = Array.isArray(payload)
    ? payload
    : payload?.results || payload?.cards || [];

  const wanted = normalizeText(cardQuery);

  if (!wanted) {
    return null;
  }

  return (
    list.find((card) => {
      const cardName = normalizeText(card.card_name);
      const title = normalizeText(stripDiscordFormatting(card.title));

      const aliases = normalizeText(card.aliases)
        .split(/[,|;]/)
        .map((alias) => alias.trim())
        .filter(Boolean);

      return (
        cardName === wanted || title === wanted || aliases.includes(wanted)
      );
    }) || null
  );
}

function cardToOg(card) {
  if (!card) {
    return null;
  }

  const name =
    stripDiscordFormatting(card.title) ||
    stripDiscordFormatting(card.card_name) ||
    "Unknown Card";

  const parts = [];

  if (card.card_type) {
    parts.push(`Class: ${stripDiscordFormatting(card.card_type)}`);
  }

  if (card.side) {
    parts.push(`Side: ${stripDiscordFormatting(card.side)}`);
  }

  if (card.stats) {
    parts.push(`Stats: ${stripDiscordFormatting(card.stats)}`);
  }

  if (card.description) {
    parts.push(`Description: ${stripDiscordFormatting(card.description)}`);
  }

  if (card.ability) {
    parts.push(`Ability: ${stripDiscordFormatting(card.ability)}`);
  }

  if (card.traits) {
    parts.push(`Traits: ${stripDiscordFormatting(card.traits)}`);
  }

  if (card.set_rarity) {
    parts.push(`Set/Rarity: ${stripDiscordFormatting(card.set_rarity)}`);
  }

  return {
    title: `${name} — TBOT Card Info`,
    description:
      truncate(parts.join("\n"), 500) ||
      `View information about ${name} on Tbot.`,
    image: resolveImageUrl(card.thumbnail),
  };
}

function cleanSlug(value) {
  let decoded = String(value || "");

  try {
    decoded = decodeURIComponent(decoded);
  } catch {}

  return decoded.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function getProfileObject(profileData) {
  return profileData?.profile || profileData || null;
}

function getProfileName(profileData, fallbackSlug) {
  const profile = getProfileObject(profileData);

  return (
    stripDiscordFormatting(
      profile?.display_name ||
        profile?.username ||
        profile?.name ||
        profile?.discord_name ||
        "",
    ) ||
    cleanSlug(fallbackSlug) ||
    "User"
  );
}

function getProfileBio(profileData) {
  const profile = getProfileObject(profileData);

  return stripDiscordFormatting(
    profile?.bio || profile?.description || profile?.about || "",
  );
}

function getDeckList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.decks)) {
    return payload.decks;
  }

  if (Array.isArray(payload?.user_decks)) {
    return payload.user_decks;
  }

  return [];
}

function getExplicitCount(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.trunc(value));
    }

    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      return Math.max(0, Number(value.trim()));
    }
  }

  return null;
}

function getProfileDeckCount(profileData, decksPayload) {
  const directCount = getExplicitCount(
    profileData?.deck_count,
    profileData?.deckCount,
  );

  if (directCount !== null) {
    return directCount;
  }

  const profile = getProfileObject(profileData);

  const profileCount = getExplicitCount(
    profile?.deck_count,
    profile?.deckCount,
    profile?.number_of_decks,
    profile?.num_decks,
    profile?.decks_count,
  );

  if (profileCount !== null) {
    return profileCount;
  }

  const payloadCount = getExplicitCount(
    decksPayload?.count,
    decksPayload?.deck_count,
    decksPayload?.deckCount,
    decksPayload?.number_of_decks,
    decksPayload?.num_decks,
  );

  if (payloadCount !== null) {
    return payloadCount;
  }

  return getDeckList(decksPayload).length;
}

function getProfileCardCount(profileData) {
  const directCount = getExplicitCount(
    profileData?.card_count,
    profileData?.cardCount,
  );

  if (directCount !== null) {
    return directCount;
  }

  const profile = getProfileObject(profileData);

  return getExplicitCount(
    profile?.card_count,
    profile?.cardCount,
    profile?.number_of_cards,
    profile?.num_cards,
    profile?.cards_count,
    profile?.collection_count,
    profile?.collectionCount,
  );
}

function buildProfileDescription(name, bio, deckCount, cardCount) {
  const parts = [];

  if (bio) {
    parts.push(bio);
  }

  const stats = [];

  if (deckCount !== null) {
    stats.push(`${deckCount} ${deckCount === 1 ? "deck" : "decks"}`);
  }

  if (cardCount !== null) {
    stats.push(`${cardCount} ${cardCount === 1 ? "card" : "cards"}`);
  }

  if (stats.length) {
    parts.push(stats.join("\n"));
  }

  if (!parts.length) {
    return `View ${name}'s Plants vs. Zombies Heroes profile and personal decks on Tbot.`;
  }

  return truncate(parts.join("\n"), 500);
}

function profileToOg(profileData, fallbackSlug, decksPayload) {
  if (!profileData) {
    return buildProfileOg(fallbackSlug);
  }

  const profile = getProfileObject(profileData);
  const name = getProfileName(profileData, fallbackSlug);
  const bio = getProfileBio(profileData);
  const deckCount = getProfileDeckCount(profileData, decksPayload);
  const cardCount = getProfileCardCount(profileData);

  return {
    title: `${name} — Tbot Profile`,
    description: buildProfileDescription(name, bio, deckCount, cardCount),
    image: resolveProfileImage(profile),
  };
}

function buildProfileOg(slug) {
  const name = cleanSlug(slug);

  if (!name) {
    return null;
  }

  return {
    title: `${name} — Tbot Profile`,
    description: `View ${name}'s Plants vs. Zombies Heroes profile and personal decks on Tbot.`,
    image: DEFAULT_IMAGE,
  };
}

function buildDeckbuilderOg(name) {
  const cleanName = cleanSlug(name);

  if (!cleanName) {
    return null;
  }

  return {
    title: `${cleanName} — Tbot Deckbuilder`,
    description: `Explore ${cleanName}'s Plants vs. Zombies Heroes decks on Tbot.`,
    image: DEFAULT_IMAGE,
  };
}

async function fetchJson(url) {
  if (!API) {
    console.error("DJANGO_API_URL is not configured");
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Django API request failed: ${response.status} ${response.statusText} — ${url}`,
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Django API request error — ${url}`, error);
    return null;
  }
}

async function fetchProfile(slug) {
  if (!slug) {
    return null;
  }

  const encodedSlug = encodeURIComponent(String(slug).trim());

  return fetchJson(`${API}/tbotapp/profile/${encodedSlug}/`);
}

async function fetchProfileDecks(slug) {
  if (!slug) {
    return null;
  }

  const encodedSlug = encodeURIComponent(String(slug).trim());

  return fetchJson(`${API}/tbotapp/profile/${encodedSlug}/decks/`);
}

async function resolveMetadata(pathname, query) {
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    const slug = query.slug || pathname.replace(/^\/profile\//, "");
    const deckKey = query.deck;

    if (deckKey) {
      const data = await fetchProfileDecks(slug);
      const deck = findDeckInList(data, deckKey);

      if (deck) {
        return deckToOg(deck);
      }
    }

    const profile = await fetchProfile(slug);

    let decksPayload = null;

    if (profile) {
      decksPayload = await fetchProfileDecks(slug);
    }

    return profileToOg(profile, slug, decksPayload);
  }

  if (pathname === "/deck" || pathname.startsWith("/deck/")) {
    const parts = pathname.split("/").filter(Boolean);

    const slug = query.slug || parts[1] || "";
    const key = query.key || parts[2] || "";

    let deckId = null;

    const numericMatch = /^(\d+)$/.exec(key);

    if (numericMatch) {
      deckId = numericMatch[1];
    } else {
      const slugIdMatch = /-(\d+)$/.exec(key);

      if (slugIdMatch) {
        deckId = slugIdMatch[1];
      }
    }

    if (!deckId) {
      return null;
    }

    const data = await fetchJson(
      `${API}/tbotapp/user-decks/shared/` +
        `${encodeURIComponent(slug)}/` +
        `${encodeURIComponent(deckId)}/`,
    );

    return deckToOg(data);
  }

  if (
    pathname === "/decklists" ||
    pathname === "/legacydecks" ||
    pathname === "/legacy-decklists"
  ) {
    const deckKey = query.deck;

    if (!deckKey) {
      return getStaticMetadata(pathname);
    }

    const listUrl =
      pathname === "/decklists"
        ? `${API}/tbotapp/decklists/`
        : `${API}/tbotapp/legacy-decklists/`;

    const data = await fetchJson(listUrl);

    return deckToOg(findDeckInList(data, deckKey));
  }

  if (pathname === "/deckbuilders" || pathname.startsWith("/deckbuilders/")) {
    const parts = pathname.split("/").filter(Boolean);

    const name = query.name || parts[1] || "";
    const deckKey = query.deck;

    if (deckKey && name) {
      const data = await fetchJson(
        `${API}/tbotapp/deckbuilders/` + `${encodeURIComponent(name)}/decks/`,
      );

      const deck = findDeckInList(data, deckKey);

      if (deck) {
        return deckToOg(deck);
      }
    }

    if (name) {
      const profile = await fetchProfile(name);

      if (profile) {
        const profileName = getProfileName(profile, name);

        return {
          title: `${profileName} — Tbot Deckbuilder`,
          description: `Explore ${profileName}'s Plants vs. Zombies Heroes decks on Tbot.`,
          image: resolveProfileImage(getProfileObject(profile)),
        };
      }

      return buildDeckbuilderOg(name);
    }

    return getStaticMetadata(pathname);
  }

  if (pathname === "/cardinfo" || pathname === "/") {
    const cardQuery = query.card;

    if (cardQuery) {
      const data = await fetchJson(`${API}/tbotapp/cardinfo/`);
      const card = findCardInList(data, cardQuery);

      return cardToOg(card);
    }
  }

  return getStaticMetadata(pathname);
}

function getStaticMetadata(pathname) {
  if (PAGE_METADATA[pathname]) {
    return PAGE_METADATA[pathname];
  }

  if (pathname === "/legacy-decklists") {
    return PAGE_METADATA["/legacydecks"];
  }

  return null;
}

function isPrivateRoute(pathname) {
  return PRIVATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getPublicSearchParams(searchParams, pathname) {
  const params = new URLSearchParams(searchParams);

  params.delete("path");

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    params.delete("slug");
  }

  return params;
}

function buildPublicUrl(pathname, searchParams) {
  const params = getPublicSearchParams(searchParams, pathname);
  const search = params.toString();

  return `${SITE_URL}${pathname}${search ? `?${search}` : ""}`;
}

function buildPublicRedirect(pathname, searchParams) {
  const params = getPublicSearchParams(searchParams, pathname);
  const search = params.toString();

  return `${pathname}${search ? `?${search}` : ""}`;
}

function buildHtml({
  title,
  description,
  image,
  url,
  noindex = false,
  redirectPath,
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);
  const safeRedirectPath = escapeHtml(redirectPath);

  const robots = noindex
    ? '<meta name="robots" content="noindex, nofollow" />'
    : '<meta name="robots" content="index, follow" />';

  const imageTags = image
    ? `
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:secure_url" content="${safeImage}" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta name="twitter:image" content="${safeImage}" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <meta
    name="description"
    content="${safeDescription}"
  />
  ${robots}
  <link
    rel="canonical"
    href="${safeUrl}"
  />
  <meta
    property="og:type"
    content="website"
  />
  <meta
    property="og:site_name"
    content="Tbot"
  />
  <meta
    property="og:title"
    content="${safeTitle}"
  />
  <meta
    property="og:description"
    content="${safeDescription}"
  />
  <meta
    property="og:url"
    content="${safeUrl}"
  />
${imageTags}
  <meta
    name="twitter:card"
    content="${image ? "summary_large_image" : "summary"}"
  />
  <meta
    name="twitter:title"
    content="${safeTitle}"
  />
  <meta
    name="twitter:description"
    content="${safeDescription}"
  />
  <meta
    http-equiv="refresh"
    content="0; url=${safeRedirectPath}"
  />
</head>
<body>
  Redirecting…
</body>
</html>`;
}

export default async function handler(req, res) {
  const rawUrl = String(req.url || "");

  let originalUrl;

  try {
    originalUrl = new URL(rawUrl, SITE_URL);
  } catch {
    return notFound(res);
  }

  let pathname = originalUrl.pathname;

  const query = {
    ...(originalUrl.searchParams
      ? Object.fromEntries(originalUrl.searchParams.entries())
      : {}),
    ...(req.query || {}),
  };

  if (query.path && typeof query.path === "string") {
    pathname = query.path;
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const originalPath = getOriginalPath(pathname, query);

  let og = null;

  try {
    og = await resolveMetadata(originalPath, query);
  } catch (error) {
    console.error("OG metadata resolution failed:", error);
    og = null;
  }

  if (!og) {
    og = getStaticMetadata(originalPath);
  }

  if (!og && isPrivateRoute(originalPath)) {
    og = {
      title: "Tbot",
      description: DEFAULT_DESCRIPTION,
      image: DEFAULT_IMAGE,
    };
  }

  if (!og) {
    return notFound(res);
  }

  const canonicalUrl = buildPublicUrl(originalPath, originalUrl.searchParams);

  const redirectPath = buildPublicRedirect(
    originalPath,
    originalUrl.searchParams,
  );

  const html = buildHtml({
    title: og.title || DEFAULT_TITLE,
    description: og.description || DEFAULT_DESCRIPTION,
    image: og.image || DEFAULT_IMAGE,
    url: canonicalUrl,
    noindex: isPrivateRoute(originalPath),
    redirectPath,
  });

  res.statusCode = 200;

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600",
  );

  return res.end(html);
}

function getOriginalPath(pathname, query) {
  if (pathname === "/api/deck-og") {
    if (query.path && typeof query.path === "string") {
      let path = query.path;

      if (path !== "/" && path.endsWith("/")) {
        path = path.slice(0, -1);
      }

      return path;
    }

    if (query.slug) {
      const slug = String(
        Array.isArray(query.slug) ? query.slug[0] : query.slug,
      );

      if (query.deck) {
        return (
          `/profile/${encodeURIComponent(slug)}` +
          `?deck=${encodeURIComponent(
            String(Array.isArray(query.deck) ? query.deck[0] : query.deck),
          )}`
        );
      }

      return `/profile/${encodeURIComponent(slug)}`;
    }

    return "/";
  }

  return pathname;
}

function notFound(res) {
  res.statusCode = 404;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  return res.end("Not found");
}
