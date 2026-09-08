const API = String(process.env.DJANGO_API_URL || "").replace(/\/+$/, "");

const SITE_URL = "https://pvzhtbot.com";

const DEFAULT_AVATAR = "https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp";

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDiscordFormatting(value) {
  return normalizeText(value)
    .replace(/<@!?\d+>/g, "")
    .replace(/<@&\d+>/g, "")
    .replace(/<#\d+>/g, "")
    .replace(/<a?:([^:>]+):\d+>/gi, " $1 ")
    .replace(/[*_~`]/g, "");
}

function truncate(value, maxLength) {
  const text = normalizeText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function getProfileObject(data) {
  if (data?.profile && typeof data.profile === "object") {
    return data.profile;
  }

  if (data && typeof data === "object") {
    return data;
  }

  return {};
}

function getProfileName(data, fallback) {
  const profile = getProfileObject(data);

  return (
    stripDiscordFormatting(
      profile.display_name ||
        profile.username ||
        profile.name ||
        profile.discord_name ||
        "",
    ) ||
    stripDiscordFormatting(fallback) ||
    "User"
  );
}

function getProfileBio(data) {
  const profile = getProfileObject(data);

  return stripDiscordFormatting(
    profile.bio || profile.description || profile.about || "",
  );
}

function getCount(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.trunc(value));
    }

    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      return Math.max(0, Number(value.trim()));
    }
  }

  return 0;
}

function getDeckCount(data) {
  const profile = getProfileObject(data);

  return getCount(
    data?.deck_count,
    data?.deckCount,
    profile.deck_count,
    profile.deckCount,
    profile.number_of_decks,
    profile.num_decks,
    profile.decks_count,
  );
}

function getCardCount(data) {
  const profile = getProfileObject(data);

  return getCount(
    data?.card_count,
    data?.cardCount,
    profile.card_count,
    profile.cardCount,
    profile.number_of_cards,
    profile.num_cards,
    profile.cards_count,
    profile.collection_count,
    profile.collectionCount,
  );
}

function getAvatarUrl(data) {
  const profile = getProfileObject(data);

  const explicitAvatar =
    normalizeText(profile.avatar_url) ||
    normalizeText(profile.avatarUrl) ||
    normalizeText(profile.profile_image) ||
    normalizeText(profile.profileImage) ||
    normalizeText(profile.image);

  if (explicitAvatar) {
    if (/^https?:\/\//i.test(explicitAvatar)) {
      return explicitAvatar;
    }

    if (API) {
      return (
        `${API}` +
        `${explicitAvatar.startsWith("/") ? "" : "/"}` +
        `${explicitAvatar}`
      );
    }
  }

  const discordId = normalizeText(profile.discord_id);

  const avatar = normalizeText(profile.avatar);

  if (discordId && avatar) {
    const extension = avatar.startsWith("a_") ? "gif" : "png";

    return (
      `${SITE_URL}/api/profile-avatar` +
      `?discord_id=${encodeURIComponent(discordId)}` +
      `&avatar=${encodeURIComponent(avatar)}` +
      `&format=${extension}`
    );
  }

  return DEFAULT_AVATAR;
}

function wrapText(value, maxCharacters, maxLines) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  const words = text.split(" ");

  const lines = [];

  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxCharacters) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (
    lines.length === maxLines &&
    words.join(" ").length > lines.join(" ").length
  ) {
    const lastIndex = lines.length - 1;

    lines[lastIndex] = `${lines[lastIndex]
      .slice(0, Math.max(1, lines[lastIndex].length - 1))
      .trimEnd()}…`;
  }

  return lines;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Tbot/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Django request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchProfile(slug) {
  if (!API) {
    throw new Error("DJANGO_API_URL is not configured");
  }

  const encodedSlug = encodeURIComponent(String(slug).trim());

  return fetchJson(`${API}/tbotapp/profile/${encodedSlug}/`);
}

function buildSvg(profileData, slug) {
  const profile = getProfileObject(profileData);

  const name = truncate(getProfileName(profileData, slug), 36);

  const bio = truncate(
    getProfileBio(profileData) || "Plants vs. Zombies Heroes player on Tbot.",
    180,
  );

  const deckCount = getDeckCount(profileData);

  const cardCount = getCardCount(profileData);

  const avatarUrl = getAvatarUrl(profileData);

  const bioLines = wrapText(bio, 62, 3);

  const safeAvatar = escapeXml(avatarUrl);

  const safeName = escapeXml(name);

  const bioText = bioLines
    .map(
      (line, index) => `
    <text
      x="310"
      y="${295 + index * 34}"
      fill="#c7cdd1"
      font-family="Arial, Helvetica, sans-serif"
      font-size="24"
    >${escapeXml(line)}</text>
  `,
    )
    .join("");

  const username = normalizeText(profile.username);

  const usernameText =
    username && username !== name
      ? `
    <text
      x="310"
      y="250"
      fill="#858f94"
      font-family="Arial, Helvetica, sans-serif"
      font-size="20"
    >@${escapeXml(username)}</text>
  `
      : "";

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="1200"
  height="630"
  viewBox="0 0 1200 630"
>
  <defs>
    <linearGradient
      id="background"
      x1="0"
      y1="0"
      x2="1"
      y2="1"
    >
      <stop
        offset="0%"
        stop-color="#101416"
      />

      <stop
        offset="100%"
        stop-color="#1b2124"
      />
    </linearGradient>

    <clipPath id="avatarClip">
      <circle
        cx="170"
        cy="315"
        r="112"
      />
    </clipPath>
  </defs>

  <rect
    width="1200"
    height="630"
    fill="url(#background)"
  />

  <rect
    x="0"
    y="0"
    width="1200"
    height="8"
    fill="#8fe38b"
  />

  <circle
    cx="1050"
    cy="80"
    r="180"
    fill="#8fe38b"
    opacity="0.05"
  />

  <circle
    cx="1120"
    cy="540"
    r="240"
    fill="#8fe38b"
    opacity="0.04"
  />

  <circle
    cx="170"
    cy="315"
    r="122"
    fill="#252c30"
  />

  <image
    href="${safeAvatar}"
    xlink:href="${safeAvatar}"
    x="58"
    y="203"
    width="224"
    height="224"
    preserveAspectRatio="xMidYMid slice"
    clip-path="url(#avatarClip)"
  />

  <circle
    cx="170"
    cy="315"
    r="112"
    fill="none"
    stroke="#8fe38b"
    stroke-width="5"
  />

  <text
    x="310"
    y="155"
    fill="#8fe38b"
    font-family="Arial, Helvetica, sans-serif"
    font-size="22"
    font-weight="700"
    letter-spacing="3"
  >TBOT PROFILE</text>

  <text
    x="310"
    y="215"
    fill="#ffffff"
    font-family="Arial, Helvetica, sans-serif"
    font-size="52"
    font-weight="700"
  >${safeName}</text>

  ${usernameText}

  ${bioText}

  <line
    x1="310"
    y1="410"
    x2="1080"
    y2="410"
    stroke="#30383c"
    stroke-width="2"
  />

  <text
    x="310"
    y="465"
    fill="#ffffff"
    font-family="Arial, Helvetica, sans-serif"
    font-size="34"
    font-weight="700"
  >${deckCount}</text>

  <text
    x="310"
    y="497"
    fill="#858f94"
    font-family="Arial, Helvetica, sans-serif"
    font-size="19"
  >${deckCount === 1 ? "DECK" : "DECKS"}</text>

  <text
    x="510"
    y="465"
    fill="#ffffff"
    font-family="Arial, Helvetica, sans-serif"
    font-size="34"
    font-weight="700"
  >${cardCount}</text>

  <text
    x="510"
    y="497"
    fill="#858f94"
    font-family="Arial, Helvetica, sans-serif"
    font-size="19"
  >${cardCount === 1 ? "CARD" : "CARDS"}</text>

  <text
    x="1080"
    y="570"
    text-anchor="end"
    fill="#626c71"
    font-family="Arial, Helvetica, sans-serif"
    font-size="18"
  >pvzhtbot.com</text>
</svg>
`;
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug || "").trim();

  if (!slug) {
    res.statusCode = 400;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    return res.end("Missing profile slug");
  }

  try {
    const profileData = await fetchProfile(slug);

    const svg = buildSvg(profileData, slug);

    res.statusCode = 200;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    );

    return res.end(svg);
  } catch (error) {
    console.error("Profile OG image failed:", error);

    const fallback = buildSvg(
      {
        profile: {
          display_name: slug,
          username: slug,
          bio: "",
        },
        deck_count: 0,
        card_count: 0,
      },
      slug,
    );

    res.statusCode = 200;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");

    return res.end(fallback);
  }
}
