
import React from "react";
import { ImageResponse } from "@vercel/og";

const API = String(
  process.env.DJANGO_API_URL || "",
).replace(/\/+$/, "");

const DISCORD_CDN =
  "https://cdn.discordapp.com";

const WIDTH = 1200;
const HEIGHT = 630;

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

  const response = await fetch(
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

async function fetchAvatar(profile) {
  const discordId = String(
    profile?.discord_id || "",
  ).trim();

  const avatar = String(
    profile?.avatar || "",
  ).trim();

  if (
    !/^\d{15,25}$/.test(
      discordId,
    )
  ) {
    return null;
  }

  if (
    !/^[a-zA-Z0-9_]+$/.test(
      avatar,
    )
  ) {
    return null;
  }

  const extension =
    avatar.startsWith("a_")
      ? "gif"
      : "png";

  const url =
    `${DISCORD_CDN}/avatars/` +
    `${discordId}/` +
    `${avatar}.${extension}` +
    "?size=1024";

  try {
    const response =
      await fetch(
        url,
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

    const buffer =
      Buffer.from(
        await response.arrayBuffer(),
      );

    const contentType =
      response.headers.get(
        "content-type",
      ) ||
      (extension === "gif"
        ? "image/gif"
        : "image/png");

    return {
      dataUrl:
        `data:${contentType};base64,` +
        buffer.toString("base64"),
      contentType,
    };
  } catch (error) {
    console.error(
      "Discord avatar fetch failed:",
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
      /^\d+$/.test(value.trim())
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

function buildImage({
  profile,
  slug,
  avatar,
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

  if (deckCount !== null) {
    stats.push(
      `${deckCount} ${
        deckCount === 1
          ? "deck"
          : "decks"
      }`,
    );
  }

  if (cardCount !== null) {
    stats.push(
      `${cardCount} ${
        cardCount === 1
          ? "card"
          : "cards"
      }`,
    );
  }

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
        background:
          "linear-gradient(135deg, #101416 0%, #151b1e 100%)",
        color: "#ffffff",
        fontFamily:
          "Arial, Helvetica, sans-serif",
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
      avatar
        ? React.createElement(
            "img",
            {
              src: avatar.dataUrl,
              width: 180,
              height: 180,
              style: {
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              },
            },
          )
        : null,
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            marginLeft: avatar
              ? "42px"
              : "0px",
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
        React.createElement(
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
        ),
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
                  maxWidth: "800px",
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

export default async function handler(
  req,
  res,
) {
  const slug = String(
    req.query?.slug || "",
  ).trim();

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
      await fetchProfile(slug);

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

    const avatar =
      await fetchAvatar(
        profile,
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

    const element =
      buildImage({
        profile,
        slug,
        avatar,
        deckCount,
        cardCount,
      });

    const imageResponse =
      new ImageResponse(
        element,
        {
          width: WIDTH,
          height: HEIGHT,
        },
      );

    const buffer =
      Buffer.from(
        await imageResponse.arrayBuffer(),
      );

    res.statusCode = 200;

    res.setHeader(
      "Content-Type",
      "image/png",
    );

    res.setHeader(
      "Content-Length",
      String(buffer.length),
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    );

    return res.end(
      buffer,
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