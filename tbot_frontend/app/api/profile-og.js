import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = String(process.env.DJANGO_API_URL || "").replace(/\/+$/, "");

const DISCORD_CDN = "https://cdn.discordapp.com";

const WIDTH = 1200;
const HEIGHT = 630;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGULAR_FONT = path.join(
  __dirname,
  "..",
  "public",
  "fonts",
  "DejaVuSans.ttf",
);

const BOLD_FONT = path.join(
  __dirname,
  "..",
  "public",
  "fonts",
  "DejaVuSans-Bold.ttf",
);

if (!fs.existsSync(REGULAR_FONT)) {
  throw new Error(`DejaVu Sans regular font not found: ${REGULAR_FONT}`);
}

if (!fs.existsSync(BOLD_FONT)) {
  throw new Error(`DejaVu Sans bold font not found: ${BOLD_FONT}`);
}

const FONT_FILES = [REGULAR_FONT, BOLD_FONT];

function cleanText(value, fallback = "") {
  const text = String(value ?? "")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateText(value, maxLength) {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function wrapText(text, maxCharsPerLine, maxLines = Infinity) {
  const clean = cleanText(text);

  if (!clean) {
    return [];
  }

  const words = clean.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxCharsPerLine) {
      if (current) {
        lines.push(current);
      }

      current = word;

      if (lines.length === maxLines) {
        break;
      }
    } else {
      current = next;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  const truncatedLines = lines.slice(0, maxLines);

  const wordsUsed = truncatedLines.join(" ").split(" ").length;

  const hasMoreText = wordsUsed < words.length;

  if (hasMoreText && truncatedLines.length) {
    const lastIndex = truncatedLines.length - 1;

    let lastLine = truncatedLines[lastIndex];

    if (lastLine.length > maxCharsPerLine - 1) {
      lastLine = lastLine.slice(0, maxCharsPerLine - 1).trim();
    }

    truncatedLines[lastIndex] = `${lastLine}…`;
  }

  return truncatedLines;
}

function getProfileObject(data) {
  if (
    data &&
    typeof data === "object" &&
    data.profile &&
    typeof data.profile === "object"
  ) {
    return data.profile;
  }

  if (data && typeof data === "object") {
    return data;
  }

  return {};
}

function getProfileName(data, slug) {
  const profile = getProfileObject(data);

  return cleanText(
    profile.display_name || profile.username || slug,
    "Tbot User",
  );
}

function getProfileBio(data) {
  const profile = getProfileObject(data);

  return cleanText(profile.bio, "Plants vs. Zombies Heroes player");
}

function getDeckCount(data) {
  if (typeof data?.deck_count === "number") {
    return data.deck_count;
  }

  if (typeof data?.profile?.deck_count === "number") {
    return data.profile.deck_count;
  }

  return 0;
}

function getCardCount(data) {
  if (typeof data?.card_count === "number") {
    return data.card_count;
  }

  if (typeof data?.profile?.card_count === "number") {
    return data.profile.card_count;
  }

  return 0;
}

function getAvatarUrl(profile) {
  const discordId = cleanText(profile?.discord_id);
  const avatar = cleanText(profile?.avatar);

  if (!/^\d{15,25}$/.test(discordId) || !/^[a-zA-Z0-9_]+$/.test(avatar)) {
    return "";
  }

  const extension = avatar.startsWith("a_") ? "gif" : "png";

  return (
    `${DISCORD_CDN}/avatars/` +
    `${discordId}/` +
    `${avatar}.${extension}` +
    "?size=1024"
  );
}

async function fetchProfile(slug) {
  const url = `${API}/tbotapp/profile/` + `${encodeURIComponent(slug)}/`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Profile request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchAvatar(profile) {
  const avatarUrl = getAvatarUrl(profile);

  if (!avatarUrl) {
    return null;
  }

  try {
    const response = await fetch(avatarUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/png,image/gif,image/jpeg,image/webp,image/*,*/*;q=0.8",
        "User-Agent": "Tbot/1.0",
      },
    });

    if (!response.ok) {
      console.error("Discord avatar request failed:", response.status);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return sharp(buffer)
      .resize(300, 300, {
        fit: "cover",
        position: "centre",
      })
      .png()
      .toBuffer();
  } catch (error) {
    console.error("Discord avatar fetch failed:", error);
    return null;
  }
}

function avatarDataUri(buffer) {
  if (!buffer) {
    return "";
  }

  return "data:image/png;base64," + buffer.toString("base64");
}

function createSvg({ name, username, bio, deckCount, cardCount, avatar }) {
  const safeName = escapeXml(truncateText(name, 28));
  const safeUsername = escapeXml(truncateText(username, 32));

  const bioLines = wrapText(bio, 52).map((line) => escapeXml(line));

  const BIO_LINE_HEIGHT = 33;

  const bioOverflow = Math.max(0, bioLines.length - 1) * BIO_LINE_HEIGHT;

  const bioMarkup = bioLines.length
    ? `
        <text
          x="270"
          y="225"
          font-family="DejaVu Sans"
          font-size="27"
          font-weight="400"
          fill="#e3e7e9"
        >
          ${bioLines
            .map(
              (line, index) =>
                `<tspan
                  x="270"
                  dy="${index === 0 ? 0 : BIO_LINE_HEIGHT}"
                >${line}</tspan>`,
            )
            .join("")}
        </text>
      `
    : "";

  const statsY = 305 + bioOverflow;
  const statsLabelY = 350 + bioOverflow;
  const statsValueY = 395 + bioOverflow;
  const taglineY = 500 + bioOverflow;
  const footerY = 540 + bioOverflow;

  const initial = escapeXml(
    String(name || "T")
      .charAt(0)
      .toUpperCase(),
  );

 const avatarMarkup = avatar
  ? `
      <circle
        cx="162"
        cy="132"
        r="100"
        fill="#8fe38b"
      />

      <circle
        cx="162"
        cy="132"
        r="94"
        fill="#101416"
      />

      <clipPath id="avatarClip">
        <circle
          cx="162"
          cy="132"
          r="88"
        />
      </clipPath>

      <image
        href="${avatar}"
        x="74"
        y="44"
        width="176"
        height="176"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#avatarClip)"
      />
    `
  : `
      <circle
        cx="162"
        cy="132"
        r="100"
        fill="#8fe38b"
      />

      <circle
        cx="162"
        cy="132"
        r="94"
        fill="#30363b"
      />

      <text
        x="162"
        y="157"
        text-anchor="middle"
        font-family="DejaVu Sans"
        font-size="72"
        font-weight="700"
        fill="#ffffff"
      >
        ${initial}
      </text>
    `;

  const CARD_HEIGHT = 566 + bioOverflow;
  const totalHeight = HEIGHT + bioOverflow;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${WIDTH}"
  height="${totalHeight}"
  viewBox="0 0 ${WIDTH} ${totalHeight}"
>
  <rect
    width="${WIDTH}"
    height="${totalHeight}"
    fill="#101416"
  />

  <rect
    x="32"
    y="32"
    width="1136"
    height="${CARD_HEIGHT}"
    rx="28"
    fill="#15191c"
    stroke="#30363b"
    stroke-width="2"
  />

  <rect
    x="32"
    y="32"
    width="12"
    height="${CARD_HEIGHT}"
    rx="6"
    fill="#8fe38b"
  />

  ${avatarMarkup}

  <text
    x="270"
    y="118"
    font-family="DejaVu Sans"
    font-size="54"
    font-weight="700"
    fill="#ffffff"
  >
    ${safeName}
  </text>

  <text
    x="270"
    y="165"
    font-family="DejaVu Sans"
    font-size="27"
    font-weight="400"
    fill="#9ba3a8"
  >
    @${safeUsername}
  </text>

  ${bioMarkup}

  <rect
    x="270"
    y="${statsY}"
    width="250"
    height="112"
    rx="18"
    fill="#202529"
  />

  <text
    x="295"
    y="${statsLabelY}"
    font-family="DejaVu Sans"
    font-size="23"
    font-weight="400"
    fill="#9ba3a8"
  >
    Decks
  </text>

  <text
    x="295"
    y="${statsValueY}"
    font-family="DejaVu Sans"
    font-size="38"
    font-weight="700"
    fill="#ffffff"
  >
    ${escapeXml(deckCount)}
  </text>

  <rect
    x="540"
    y="${statsY}"
    width="250"
    height="112"
    rx="18"
    fill="#202529"
  />

  <text
    x="565"
    y="${statsLabelY}"
    font-family="DejaVu Sans"
    font-size="23"
    font-weight="400"
    fill="#9ba3a8"
  >
    Cards
  </text>

  <text
    x="565"
    y="${statsValueY}"
    font-family="DejaVu Sans"
    font-size="38"
    font-weight="700"
    fill="#ffffff"
  >
    ${escapeXml(cardCount)}
  </text>
</svg>
`;
}

export default async function handler(req, res) {
  const slug = cleanText(req.query?.slug);

  if (!slug) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Missing profile slug");
  }

  try {
    const profileData = await fetchProfile(slug);

    const profile = getProfileObject(profileData);

    const name = getProfileName(profileData, slug);

    const username = cleanText(
      profile.username || profile.profile_slug || slug,
      slug,
    );

    const bio = getProfileBio(profileData);

    const deckCount = getDeckCount(profileData);
    const cardCount = getCardCount(profileData);

    const avatarBuffer = await fetchAvatar(profile);
    const avatar = avatarDataUri(avatarBuffer);

    const svg = createSvg({
      name,
      username,
      bio,
      deckCount,
      cardCount,
      avatar,
    });

    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: WIDTH,
      },
      font: {
        fontFiles: FONT_FILES,
        loadSystemFonts: false,
        defaultFontFamily: "DejaVu Sans",
      },
    });

    const png = resvg.render().asPng();

    res.statusCode = 200;

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", String(png.length));

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    );

    return res.end(png);
  } catch (error) {
    console.error("Profile OG generation failed:", error);

    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    return res.end("Unable to generate profile image");
  }
}