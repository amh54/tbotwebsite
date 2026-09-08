import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const API = String(
  process.env.DJANGO_API_URL || "",
).replace(/\/+$/, "");

const DISCORD_CDN =
  "https://cdn.discordapp.com";

const WIDTH = 1200;
const HEIGHT = 630;

const require = createRequire(
  import.meta.url,
);

const FONT_PACKAGE_DIR = path.dirname(
  require.resolve(
    "dejavu-fonts-ttf/package.json",
  ),
);

const FONT_DIR = path.join(
  FONT_PACKAGE_DIR,
  "ttf",
);

const REGULAR_FONT = path.join(
  FONT_DIR,
  "DejaVuSans.ttf",
);

const BOLD_FONT = path.join(
  FONT_DIR,
  "DejaVuSans-Bold.ttf",
);

if (!fs.existsSync(REGULAR_FONT)) {
  throw new Error(
    `DejaVu Sans regular font not found: ${REGULAR_FONT}`,
  );
}

if (!fs.existsSync(BOLD_FONT)) {
  throw new Error(
    `DejaVu Sans bold font not found: ${BOLD_FONT}`,
  );
}

const FONT_FILES = [
  REGULAR_FONT,
  BOLD_FONT,
];

function cleanText(value) {
  return String(value ?? "")
    .replace(
      /<a?:([^:>]+):\d+>/gi,
      " $1 ",
    )
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value, max) {
  const text = cleanText(value);

  if (text.length <= max) {
    return text;
  }

  return `${text
    .slice(0, max - 3)
    .trimEnd()}...`;
}

function getProfile(data) {
  return data?.profile || data || null;
}

async function fetchProfile(slug) {
  if (!API) {
    throw new Error(
      "DJANGO_API_URL is not configured",
    );
  }

  const encodedSlug =
    encodeURIComponent(
      String(slug).trim(),
    );

  const response =
    await fetch(
      `${API}/tbotapp/profile/${encodedSlug}/`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `Django profile request failed: ${response.status}`,
    );
  }

  return response.json();
}

function getAvatarUrl(profile) {
  const discordId =
    String(
      profile?.discord_id || "",
    ).trim();

  const avatar =
    String(
      profile?.avatar || "",
    ).trim();

  if (
    !/^\d{15,25}$/.test(
      discordId,
    )
  ) {
    return "";
  }

  if (
    !/^[a-zA-Z0-9_]+$/.test(
      avatar,
    )
  ) {
    return "";
  }

  const extension =
    avatar.startsWith("a_")
      ? "gif"
      : "png";

  return (
    `${DISCORD_CDN}/avatars/` +
    `${discordId}/` +
    `${avatar}.${extension}?size=512`
  );
}

async function fetchAvatarBuffer(
  avatarUrl,
) {
  if (!avatarUrl) {
    return null;
  }

  try {
    const response =
      await fetch(
        avatarUrl,
        {
          headers: {
            Accept:
              "image/png,image/gif,image/*,*/*;q=0.8",
            "User-Agent":
              "Tbot/1.0",
          },
        },
      );

    if (!response.ok) {
      console.error(
        `Discord avatar request failed: ${response.status}`,
      );

      return null;
    }

    const sourceBuffer =
      Buffer.from(
        await response.arrayBuffer(),
      );

    return await sharp(
      sourceBuffer,
      {
        animated: true,
      },
    )
      .resize(
        512,
        512,
        {
          fit: "cover",
          position: "centre",
        },
      )
      .png()
      .toBuffer();
  } catch (error) {
    console.error(
      "Discord avatar processing failed:",
      error,
    );

    return null;
  }
}

function getCount(...values) {
  for (const value of values) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return Math.max(
        0,
        Math.trunc(value),
      );
    }

    if (
      typeof value === "string" &&
      /^\d+$/.test(
        value.trim(),
      )
    ) {
      return Math.max(
        0,
        Number(value.trim()),
      );
    }
  }

  return null;
}

function getName(
  profile,
  slug,
) {
  return (
    cleanText(
      profile?.display_name ||
        profile?.username ||
        profile?.name ||
        "",
    ) ||
    cleanText(slug) ||
    "User"
  );
}

function getUsername(
  profile,
  slug,
) {
  return (
    cleanText(
      profile?.username ||
        profile?.profile_slug ||
        "",
    ) ||
    cleanText(slug)
  );
}

function getBio(profile) {
  return truncate(
    profile?.bio ||
      profile?.description ||
      profile?.about ||
      "",
    280,
  );
}

function wrapText(
  text,
  maxChars,
) {
  const clean =
    cleanText(text);

  if (!clean) {
    return [];
  }

  const words =
    clean.split(" ");

  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current
      ? `${current} ${word}`
      : word;

    if (
      next.length >
      maxChars
    ) {
      if (current) {
        lines.push(current);
      }

      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 5);
}

function buildAvatarSvg(
  avatarBuffer,
  name,
) {
  if (!avatarBuffer) {
    return `
      <circle
        cx="160"
        cy="315"
        r="100"
        fill="#20282c"
      />

      <circle
        cx="160"
        cy="315"
        r="92"
        fill="#151b1e"
      />

      <text
        x="160"
        y="337"
        text-anchor="middle"
        font-family="DejaVu Sans"
        font-size="58"
        font-weight="700"
        fill="#8fe38b"
      >${escapeXml(
        name
          .charAt(0)
          .toUpperCase(),
      )}</text>
    `;
  }

  const avatarBase64 =
    avatarBuffer.toString(
      "base64",
    );

  return `
    <defs>
      <clipPath id="avatarClip">
        <circle
          cx="160"
          cy="315"
          r="92"
        />
      </clipPath>
    </defs>

    <circle
      cx="160"
      cy="315"
      r="100"
      fill="#20282c"
    />

    <image
      href="data:image/png;base64,${avatarBase64}"
      x="68"
      y="223"
      width="184"
      height="184"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#avatarClip)"
    />
  `;
}

function buildSvg({
  profile,
  slug,
  avatarBuffer,
  deckCount,
  cardCount,
}) {
  const name =
    getName(
      profile,
      slug,
    );

  const username =
    getUsername(
      profile,
      slug,
    );

  const bio =
    getBio(profile);

  const stats = [];

  if (
    deckCount !== null
  ) {
    stats.push(
      `${deckCount} ${
        deckCount === 1
          ? "deck"
          : "decks"
      }`,
    );
  }

  if (
    cardCount !== null
  ) {
    stats.push(
      `${cardCount} ${
        cardCount === 1
          ? "card"
          : "cards"
      }`,
    );
  }

  const bioLines =
    wrapText(
      bio,
      68,
    );

  const avatarMarkup =
    buildAvatarSvg(
      avatarBuffer,
      name,
    );

  const bioMarkup =
    bioLines.length
      ? `
        <text
          x="330"
          y="370"
          font-family="DejaVu Sans"
          font-size="24"
          font-weight="400"
          fill="#e1e5e7"
        >
          ${bioLines
            .map(
              (
                line,
                index,
              ) =>
                `<tspan
                  x="330"
                  dy="${
                    index === 0
                      ? 0
                      : 33
                  }"
                >${escapeXml(
                  line,
                )}</tspan>`,
            )
            .join("")}
        </text>
      `
      : "";

  const statsY =
    bioLines.length
      ? 555
      : 470;

  const statsMarkup =
    stats.length
      ? `
        <text
          x="330"
          y="${statsY}"
          font-family="DejaVu Sans"
          font-size="25"
          font-weight="700"
          fill="#8fe38b"
        >${escapeXml(
          stats.join("  -  "),
        )}</text>
      `
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${WIDTH}"
  height="${HEIGHT}"
  viewBox="0 0 ${WIDTH} ${HEIGHT}"
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
        stop-color="#151b1e"
      />
    </linearGradient>
  </defs>

  <rect
    width="${WIDTH}"
    height="${HEIGHT}"
    fill="url(#background)"
  />

  <rect
    x="42"
    y="42"
    width="1116"
    height="546"
    rx="28"
    fill="#151b1e"
    stroke="#252e32"
    stroke-width="2"
  />

  ${avatarMarkup}

  <text
    x="330"
    y="145"
    font-family="DejaVu Sans"
    font-size="24"
    font-weight="700"
    letter-spacing="2"
    fill="#8fe38b"
  >TBOT PROFILE</text>

  <text
    x="330"
    y="220"
    font-family="DejaVu Sans"
    font-size="62"
    font-weight="700"
    fill="#ffffff"
  >${escapeXml(
    name,
  )}</text>

  <text
    x="330"
    y="265"
    font-family="DejaVu Sans"
    font-size="28"
    fill="#aeb7bb"
  >@${escapeXml(
    username,
  )}</text>

  ${bioMarkup}

  ${statsMarkup}

  <text
    x="1090"
    y="555"
    text-anchor="end"
    font-family="DejaVu Sans"
    font-size="22"
    font-weight="600"
    fill="#697276"
  >pvzhtbot.com</text>
</svg>`;
}

export default async function handler(
  req,
  res,
) {
  const requestUrl =
    new URL(
      req.url,
      "https://pvzhtbot.com",
    );

  const slug =
    requestUrl.searchParams.get(
      "slug",
    );

  if (!slug) {
    res.statusCode = 400;

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8",
    );

    return res.end(
      "Missing profile slug",
    );
  }

  try {
    const data =
      await fetchProfile(
        slug,
      );

    const profile =
      getProfile(data);

    if (!profile) {
      res.statusCode = 404;

      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8",
      );

      return res.end(
        "Profile not found",
      );
    }

    const avatarUrl =
      getAvatarUrl(
        profile,
      );

    const avatarBuffer =
      await fetchAvatarBuffer(
        avatarUrl,
      );

    const deckCount =
      getCount(
        data?.deck_count,
        data?.deckCount,
        profile?.deck_count,
        profile?.deckCount,
        profile?.number_of_decks,
        profile?.num_decks,
        profile?.decks_count,
      );

    const cardCount =
      getCount(
        data?.card_count,
        data?.cardCount,
        profile?.card_count,
        profile?.cardCount,
        profile?.number_of_cards,
        profile?.num_cards,
        profile?.cards_count,
        profile?.collection_count,
        profile?.collectionCount,
      );

    const svg =
      buildSvg({
        profile,
        slug,
        avatarBuffer,
        deckCount,
        cardCount,
      });

    const resvg =
      new Resvg(
        svg,
        {
          fitTo: {
            mode: "width",
            value: WIDTH,
          },
          font: {
            fontFiles:
              FONT_FILES,
            loadSystemFonts: false,
            defaultFontFamily:
              "DejaVu Sans",
          },
        },
      );

    const png =
      resvg
        .render()
        .asPng();

    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "image/png",
    );

    res.setHeader(
      "Content-Length",
      String(
        png.length,
      ),
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    );

    return res.end(
      png,
    );
  } catch (error) {
    console.error(
      "Profile OG generation failed:",
      error,
    );

    res.statusCode = 500;

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8",
    );

    return res.end(
      "Unable to generate profile image",
    );
  }
}