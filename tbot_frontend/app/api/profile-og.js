import React from "react";
import { ImageResponse } from "@vercel/og";

const API = String(process.env.DJANGO_API_URL || "").replace(/\/+$/, "");

const DISCORD_CDN = "https://cdn.discordapp.com";

const WIDTH = 1200;
const HEIGHT = 630;

function getProfile(data) {
  return data?.profile || data || null;
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<a?:([^:>]+):\d+>/gi, " $1 ")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max) {
  const text = cleanText(value);

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1).trimEnd()}…`;
}

async function fetchProfile(slug) {
  if (!API || !slug) {
    return null;
  }

  const encodedSlug = encodeURIComponent(String(slug).trim());

  const response = await fetch(`${API}/tbotapp/profile/${encodedSlug}/`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Profile request failed: ${response.status}`);
  }

  return response.json();
}

async function getAvatarUrl(profile) {
  const discordId = String(profile?.discord_id || "").trim();

  const avatar = String(profile?.avatar || "").trim();

  if (!discordId || !avatar) {
    return "";
  }

  const extension = avatar.startsWith("a_") ? "gif" : "png";

  const url =
    `${DISCORD_CDN}/avatars/` +
    `${discordId}/` +
    `${avatar}.${extension}` +
    "?size=1024";

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "image/png,image/gif,image/*,*/*;q=0.8",
        "User-Agent": "Tbot/1.0",
      },
    });

    if (!response.ok) {
      console.error(`Discord avatar request failed: ${response.status}`);

      return "";
    }

    const contentType = response.headers.get("content-type") || "image/png";

    const buffer = Buffer.from(await response.arrayBuffer());

    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Discord avatar fetch failed:", error);

    return "";
  }
}

function getName(profile, slug) {
  return (
    cleanText(
      profile?.display_name || profile?.username || profile?.name || "",
    ) ||
    cleanText(slug) ||
    "User"
  );
}

function getUsername(profile, slug) {
  return (
    cleanText(profile?.username || profile?.profile_slug || "") ||
    cleanText(slug)
  );
}

function getBio(profile) {
  return truncate(
    profile?.bio || profile?.description || profile?.about || "",
    280,
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

  return null;
}

function getDeckCount(data, profile) {
  return getCount(
    data?.deck_count,
    data?.deckCount,
    profile?.deck_count,
    profile?.deckCount,
    profile?.number_of_decks,
    profile?.num_decks,
    profile?.decks_count,
  );
}

function getCardCount(data, profile) {
  return getCount(
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
}

function pluralize(count, singular, plural) {
  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${plural}`;
}

function createImage({ profile, slug, avatarUrl, deckCount, cardCount }) {
  const name = getName(profile, slug);

  const username = getUsername(profile, slug);

  const bio = getBio(profile);

  const stats = [];

  if (deckCount !== null) {
    stats.push(pluralize(deckCount, "deck", "decks"));
  }

  if (cardCount !== null) {
    stats.push(pluralize(cardCount, "card", "cards"));
  }

  const children = [];

  if (avatarUrl) {
    children.push(
      React.createElement("img", {
        src: avatarUrl,
        width: 180,
        height: 180,
        style: {
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "6px solid rgba(255,255,255,0.18)",
        },
      }),
    );
  }

  children.push(
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          marginLeft: avatarUrl ? "42px" : "0px",
          flex: 1,
        },
      },
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "24px",
            fontWeight: 700,
            color: "#8fe38b",
            marginBottom: "10px",
          },
        },
        "TBOT PROFILE",
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "64px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.05,
          },
        },
        name,
      ),
      username
        ? React.createElement(
            "div",
            {
              style: {
                display: "flex",
                fontSize: "28px",
                color: "#aeb7bb",
                marginTop: "10px",
              },
            },
            `@${username}`,
          )
        : null,
      bio
        ? React.createElement(
            "div",
            {
              style: {
                display: "flex",
                fontSize: "26px",
                color: "#e1e5e7",
                lineHeight: 1.35,
                marginTop: "28px",
                maxWidth: "780px",
              },
            },
            bio,
          )
        : null,
      stats.length
        ? React.createElement(
            "div",
            {
              style: {
                display: "flex",
                fontSize: "25px",
                fontWeight: 700,
                color: "#8fe38b",
                marginTop: "30px",
              },
            },
            stats.join(" • "),
          )
        : null,
    ),
  );

  return React.createElement(
    "div",
    {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px",
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #101416 0%, #151b1e 100%)",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          width: "100%",
        },
      },
      ...children,
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          position: "absolute",
          right: "70px",
          bottom: "38px",
          fontSize: "22px",
          color: "#697276",
          fontWeight: 600,
        },
      },
      "pvzhtbot.com",
    ),
  );
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug || "").trim();

  if (!slug) {
    res.statusCode = 400;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    return res.end("Missing profile slug");
  }

  try {
    const data = await fetchProfile(slug);

    const profile = getProfile(data);

    if (!profile) {
      res.statusCode = 404;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");

      return res.end("Profile not found");
    }

    const avatarUrl = await getAvatarUrl(profile);

    const deckCount = getDeckCount(data, profile);

    const cardCount = getCardCount(data, profile);

    const image = createImage({
      profile,
      slug,
      avatarUrl,
      deckCount,
      cardCount,
    });

    const response = new ImageResponse(image, {
      width: WIDTH,
      height: HEIGHT,
    });

    res.statusCode = 200;

    res.setHeader("Content-Type", "image/png");

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600",
    );

    return res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("Profile OG generation failed:", error);

    res.statusCode = 500;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    return res.end("Unable to generate profile image");
  }
}
