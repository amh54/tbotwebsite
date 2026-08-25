import { useEffect, useMemo, useState } from "react";
import CardModal from "../components/cardmodal";
import "../css/cardinfo.css";
import "../css/navbar.css";
import "../css/loading.css";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const STAT_ICON_LINKS = {
  cost: "https://i.ibb.co/Q30j2CgC/brainz.webp",
  strength: "https://i.ibb.co/GQt785K6/strength.webp",
  health: "https://i.ibb.co/bMj86Wvg/health.webp",
  sun: "https://i.ibb.co/3mwp3d6s/sun.webp",
  healthstrength: "https://i.ibb.co/9344x8fP/healthstrength.webp",
};

const TRAIT_ICON_LINKS = {
  antihero: "https://i.ibb.co/zHmWTFLQ/anti-hero.webp",
  strikethrough: "https://i.ibb.co/99KG7vjj/strikethrough.webp",
  deadly: "https://i.ibb.co/xt6pkMT1/deadly.webp",
  special: "https://i.ibb.co/Sw0yS0Mg/special.webp",
  freeze: "https://i.ibb.co/hFPRcrp6/freeze.webp",
  bullseye: "https://i.ibb.co/tTp9zzdh/Bullseye.webp",
  frenzy: "https://i.ibb.co/0RC4sW0b/frenzy.webp",
  armored: "https://i.ibb.co/SXTYdVry/armored.webp",
  overshoot: "https://i.ibb.co/prbYt2DX/overshoot.webp",
  untrickable: "https://i.ibb.co/235QDZsg/untrickable.webp",
  doublestrike: "https://i.ibb.co/9HcptVCN/doublestrike.webp",
  splashdamage: "",
};

const CLASS_ICON_LINKS = {
  guardian: "https://i.ibb.co/q339dYKK/guardian.webp",
  kabloom: "https://i.ibb.co/4gWkPT7f/kabloom.webp",
  megagrow: "https://i.ibb.co/svc6sx30/megagrow.webp",
  smarty: "https://i.ibb.co/V0bL3RYk/smarty.webp",
  solar: "https://i.ibb.co/YFMMD4DZ/sun.webp",
  beastly: "https://i.ibb.co/xS6b10P5/beastly.webp",
  brainy: "https://i.ibb.co/d40zFh8r/Brainy.webp",
  crazy: "https://i.ibb.co/HTvzSsXX/crazy.webp",
  hearty: "https://i.ibb.co/ynKbzV8v/hearty.webp",
  sneaky: "https://i.ibb.co/nqFdR6HJ/Pv-ZH-Sneaky-Icon.png",
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getRarityName = (setRarity) => {
  if (!setRarity) {
    return "";
  }

  const value = String(setRarity).trim();
  const separatorIndex = value.lastIndexOf(" - ");

  if (separatorIndex === -1) {
    return value;
  }

  return value.slice(separatorIndex + 3).trim();
};
const HERO_CACHE_KEY = "tbot_hero_info_cache";
const HERO_CACHE_DURATION = 24 * 60 * 60 * 1000;
const getCachedHeroData = () => {
  try {
    const cached = sessionStorage.getItem(HERO_CACHE_KEY);

    if (!cached) {
      return {
        cards: [],
        totalHeroes: 0,
        hasCache: false,
        isFresh: false,
      };
    }

    const parsed = JSON.parse(cached);

    if (!Array.isArray(parsed?.results) || parsed.results.length === 0) {
      return {
        cards: [],
        totalHeroes: 0,
        hasCache: false,
        isFresh: false,
      };
    }

    const timestamp = Number(parsed.timestamp || 0);
    const age = Date.now() - timestamp;

    return {
      cards: parsed.results,
      totalHeroes: Number(parsed.count) || parsed.results.length,
      hasCache: true,
      isFresh: age < HERO_CACHE_DURATION,
    };
  } catch (error) {
    console.warn("Unable to read hero cache:", error);

    return {
      cards: [],
      totalHeroes: 0,
      hasCache: false,
      isFresh: false,
    };
  }
};
function HeroInfo() {
  const initialHeroCache = getCachedHeroData();

  const [cards, setCards] = useState(initialHeroCache.cards);
  const [side, setSide] = useState("Plants");
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(!initialHeroCache.hasCache);
  const [error, setError] = useState("");
  const [totalHeroes, setTotalHeroes] = useState(initialHeroCache.totalHeroes);

  const getEmojiIcon = (emoji) => {
    const match = String(emoji || "").match(/^<:([^:>]+):\d+>$/);

    if (!match) {
      return null;
    }

    const emojiName = match[1].toLowerCase().replace(/[-_\s]/g, "");

    const iconMap = {
      brainz: {
        url: STAT_ICON_LINKS.cost,
        alt: "Brainz",
      },

      strength: {
        url: STAT_ICON_LINKS.strength,
        alt: "Strength",
      },

      health: {
        url: STAT_ICON_LINKS.health,
        alt: "Health",
      },

      sun: {
        url: STAT_ICON_LINKS.sun,
        alt: "Sun",
      },

      healthstrength: {
        url: STAT_ICON_LINKS.healthstrength,
        alt: "Health and Strength",
      },

      deadly: {
        url: TRAIT_ICON_LINKS.deadly,
        alt: "Deadly",
      },

      freeze: {
        url: TRAIT_ICON_LINKS.freeze,
        alt: "Freeze",
      },

      antihero: {
        url: TRAIT_ICON_LINKS.antihero,
        alt: "Anti-Hero",
      },

      strikethrough: {
        url: TRAIT_ICON_LINKS.strikethrough,
        alt: "Strikethrough",
      },

      special: {
        url: TRAIT_ICON_LINKS.special,
        alt: "Special",
      },

      bullseye: {
        url: TRAIT_ICON_LINKS.bullseye,
        alt: "Bullseye",
      },

      frenzy: {
        url: TRAIT_ICON_LINKS.frenzy,
        alt: "Frenzy",
      },

      armored: {
        url: TRAIT_ICON_LINKS.armored,
        alt: "Armored",
      },

      overshoot: {
        url: TRAIT_ICON_LINKS.overshoot,
        alt: "Overshoot",
      },

      untrickable: {
        url: TRAIT_ICON_LINKS.untrickable,
        alt: "Untrickable",
      },

      doublestrike: {
        url: TRAIT_ICON_LINKS.doublestrike,
        alt: "Double Strike",
      },

      splashdamage: {
        url: TRAIT_ICON_LINKS.splashdamage,
        alt: "Splash Damage",
      },

      guardian: {
        url: CLASS_ICON_LINKS.guardian,
        alt: "Guardian",
      },

      kabloom: {
        url: CLASS_ICON_LINKS.kabloom,
        alt: "Kabloom",
      },

      megagrow: {
        url: CLASS_ICON_LINKS.megagrow,
        alt: "Mega-Grow",
      },

      smarty: {
        url: CLASS_ICON_LINKS.smarty,
        alt: "Smarty",
      },

      solar: {
        url: CLASS_ICON_LINKS.solar,
        alt: "Solar",
      },

      beastly: {
        url: CLASS_ICON_LINKS.beastly,
        alt: "Beastly",
      },

      brainy: {
        url: CLASS_ICON_LINKS.brainy,
        alt: "Brainy",
      },

      crazy: {
        url: CLASS_ICON_LINKS.crazy,
        alt: "Crazy",
      },

      hearty: {
        url: CLASS_ICON_LINKS.hearty,
        alt: "Hearty",
      },

      sneaky: {
        url: CLASS_ICON_LINKS.sneaky,
        alt: "Sneaky",
      },
    };

    return iconMap[emojiName] || null;
  };

  const renderTitleText = (title) => {
    if (!title) {
      return null;
    }

    const text = String(title);

    const pattern =
      /(<:[^:>]+:\d+>)|(\*\*__[\s\S]*?__\*\*)|(__\*\*[\s\S]*?\*\*__)|(\*\*[\s\S]*?\*\*)|(__[\s\S]*?__)/gi;

    const matches = [...text.matchAll(pattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`title-text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      if (match[1]) {
        const icon = getEmojiIcon(match[1]);

        if (icon?.url) {
          parts.push(
            <img
              key={`title-icon-${index}`}
              src={icon.url}
              alt={icon.alt}
              className="card-title-class-icon"
            />,
          );
        } else {
          parts.push(
            <span key={`title-emoji-${index}`}>
              {match[1].replace(/^<:([^:>]+):\d+>$/, "$1")}
            </span>,
          );
        }
      } else if (match[2]) {
        parts.push(
          <strong key={`title-bold-underline-${index}`}>
            <u>{match[2].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[3]) {
        parts.push(
          <strong key={`title-underline-bold-${index}`}>
            <u>{match[3].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[4]) {
        parts.push(
          <strong key={`title-bold-${index}`}>{match[4].slice(2, -2)}</strong>,
        );
      } else if (match[5]) {
        parts.push(
          <u key={`title-underline-${index}`}>{match[5].slice(2, -2)}</u>,
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="title-end">{text.slice(lastIndex)}</span>);
    }

    return <span className="card-title-content">{parts}</span>;
  };

  const renderStatsText = (stats) => {
    if (!stats) {
      return null;
    }

    const text = String(stats);
    const pattern = /(<:[^:>]+:\d+>)/gi;
    const matches = [...text.matchAll(pattern)];

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullEmoji = match[1];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`stats-text-${index}`}>
            {text.slice(lastIndex, matchIndex)}
          </span>,
        );
      }

      const icon = getEmojiIcon(fullEmoji);

      if (icon?.url) {
        parts.push(
          <img
            key={`stats-icon-${index}`}
            src={icon.url}
            alt={icon.alt}
            className="card-stat-icon"
          />,
        );
      } else {
        parts.push(
          <span key={`stats-emoji-${index}`}>
            {fullEmoji.replace(/^<:([^:>]+):\d+>$/, "$1")}
          </span>,
        );
      }

      lastIndex = matchIndex + fullEmoji.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="stats-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const renderTraitText = (text) => {
    if (!text) {
      return null;
    }

    const rawText = String(text);

    const pattern =
      /(<:[^:>]+:\d+>)|(\*\*__[\s\S]*?__\*\*)|(__\*\*[\s\S]*?\*\*__)|(\*\*[\s\S]*?\*\*)|(__[\s\S]*?__)/gi;

    const matches = [...rawText.matchAll(pattern)];

    if (matches.length === 0) {
      return (
        <span className="trait-rendered">
          {rawText
            .replace(/\*\*/g, "")
            .replace(/__/g, "")
            .replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
        </span>
      );
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const normalText = rawText.slice(lastIndex, matchIndex);

        parts.push(
          <span key={`trait-normal-${index}`}>
            {normalText
              .replace(/\*\*/g, "")
              .replace(/__/g, "")
              .replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
          </span>,
        );
      }

      if (match[1]) {
        const icon = getEmojiIcon(match[1]);

        if (icon?.url) {
          parts.push(
            <img
              key={`trait-icon-${index}`}
              src={icon.url}
              alt={icon.alt}
              className="card-trait-icon"
            />,
          );
        } else {
          parts.push(
            <span key={`trait-emoji-${index}`}>
              {match[1].replace(/^<:([^:>]+):\d+>$/, "$1")}
            </span>,
          );
        }
      } else if (match[2]) {
        parts.push(
          <strong key={`trait-bold-underline-${index}`}>
            <u>{match[2].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[3]) {
        parts.push(
          <strong key={`trait-underline-bold-${index}`}>
            <u>{match[3].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[4]) {
        parts.push(
          <strong key={`trait-bold-${index}`}>{match[4].slice(2, -2)}</strong>,
        );
      } else if (match[5]) {
        parts.push(
          <u key={`trait-underline-${index}`}>{match[5].slice(2, -2)}</u>,
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < rawText.length) {
      parts.push(
        <span key="trait-end">
          {rawText
            .slice(lastIndex)
            .replace(/\*\*/g, "")
            .replace(/__/g, "")
            .replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
        </span>,
      );
    }

    return <span className="trait-rendered">{parts}</span>;
  };

  const renderAbilityText = (text, maxLength = 177) => {
    if (!text) {
      return null;
    }

    let value = String(text);

    if (value.length > maxLength) {
      let cut = value.slice(0, maxLength);

      const lastEmojiStart = cut.lastIndexOf("<:");
      const lastEmojiEnd = cut.lastIndexOf(">");

      if (lastEmojiStart > lastEmojiEnd) {
        cut = cut.slice(0, lastEmojiStart);
      }

      value = `${cut.trimEnd()}…`;
    }

    const pattern =
      /(<:[^:>]+:\d+>)|(\*\*__[\s\S]*?__\*\*)|(__\*\*[\s\S]*?\*\*__)|(\*\*[\s\S]*?\*\*)|(__[\s\S]*?__)/gi;

    const matches = [...value.matchAll(pattern)];

    if (matches.length === 0) {
      return (
        <span>
          {value.replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
        </span>
      );
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const normalText = value.slice(lastIndex, matchIndex);

        parts.push(
          <span key={`ability-text-${index}`}>
            {normalText.replace(
              /<:([^:>]+):\d+>/gi,
              (_, emojiName) => emojiName,
            )}
          </span>,
        );
      }

      if (match[1]) {
        const icon = getEmojiIcon(match[1]);

        if (icon?.url) {
          parts.push(
            <img
              key={`ability-icon-${index}`}
              src={icon.url}
              alt={icon.alt}
              className="card-ability-icon"
            />,
          );
        } else {
          parts.push(
            <span key={`ability-emoji-${index}`}>
              {match[1].replace(/^<:([^:>]+):\d+>$/, "$1")}
            </span>,
          );
        }
      } else if (match[2]) {
        parts.push(
          <strong key={`bold-underline-${index}`}>
            <u>{match[2].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[3]) {
        parts.push(
          <strong key={`underline-bold-${index}`}>
            <u>{match[3].slice(4, -4)}</u>
          </strong>,
        );
      } else if (match[4]) {
        parts.push(
          <strong key={`bold-${index}`}>{match[4].slice(2, -2)}</strong>,
        );
      } else if (match[5]) {
        parts.push(<u key={`underline-${index}`}>{match[5].slice(2, -2)}</u>);
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < value.length) {
      parts.push(
        <span key="ability-text-end">
          {value
            .slice(lastIndex)
            .replace(/<:([^:>]+):\d+>/gi, (_, emojiName) => emojiName)}
        </span>,
      );
    }

    return <span>{parts}</span>;
  };
 useEffect(() => {
  const controller = new AbortController();

  const loadHeroes = async () => {
    let hasCachedData = false;
    let cacheIsFresh = false;

    try {
      setError("");

      /*
       * Read cache again inside the effect.
       * This handles navigation/remounts correctly.
       */
      try {
        const cached = sessionStorage.getItem(HERO_CACHE_KEY);

        if (cached) {
          const parsed = JSON.parse(cached);

          if (
            Array.isArray(parsed?.results) &&
            parsed.results.length > 0
          ) {
            hasCachedData = true;

            const cachedResults = parsed.results;
            const cachedCount =
              Number(parsed.count) || cachedResults.length;

            const cacheAge =
              Date.now() - Number(parsed.timestamp || 0);

            cacheIsFresh = cacheAge < HERO_CACHE_DURATION;

            /*
             * If the component mounted without cached state,
             * immediately populate it now.
             */
            setCards(cachedResults);
            setTotalHeroes(cachedCount);

            /*
             * Cached data is already usable, so don't show
             * the loading screen while refreshing.
             */
            setLoading(false);

            /*
             * Fresh cache = no API request needed.
             */
            if (cacheIsFresh) {
              return;
            }
          }
        }
      } catch (cacheError) {
        console.warn("Unable to read hero cache:", cacheError);
      }

      /*
       * Refresh stale/missing cache from the API.
       */
      const endpoint = `${API_BASE_URL}/tbotapp/heroinfo/`;

      const response = await fetch(endpoint, {
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
          const errorPayload = await response.json();

          if (errorPayload?.detail) {
            message = `${message}: ${errorPayload.detail}`;
          } else if (errorPayload?.error) {
            message = `${message}: ${errorPayload.error}`;
          }
        } catch {
          // Ignore invalid JSON.
        }

        throw new Error(message);
      }

      const data = await response.json();

      const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
          ? data
          : [];

      const count =
        Number(data?.count) || results.length;

      /*
       * Never replace working cached data with an empty
       * API response.
       */
      if (results.length > 0) {
        setCards(results);
        setTotalHeroes(count);

        try {
          sessionStorage.setItem(
            HERO_CACHE_KEY,
            JSON.stringify({
              timestamp: Date.now(),
              count,
              results,
            }),
          );
        } catch (cacheError) {
          console.warn(
            "Unable to save hero cache:",
            cacheError,
          );
        }
      } else if (!hasCachedData) {
        setCards([]);
        setTotalHeroes(0);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      console.error("Hero loading failed:", err);

      /*
       * If cached heroes exist, keep displaying them.
       */
      if (!hasCachedData) {
        setCards([]);
        setError(
          `Unable to load heroes right now. ${
            err.message || ""
          }`.trim(),
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  loadHeroes();

  return () => controller.abort();
}, []);
  useEffect(() => {
    if (!cards.length) {
      return;
    }

    const selectedSide = normalizeText(side);

    const visibleHeroes = cards.filter((card) => {
      const cardSide = normalizeText(card.side);

      if (selectedSide === "plants") {
        return cardSide === "plant" || cardSide === "plants";
      }

      if (selectedSide === "zombies") {
        return cardSide === "zombie" || cardSide === "zombies";
      }

      return false;
    });

    visibleHeroes.forEach((card) => {
      if (!card.thumbnail) {
        return;
      }

      const image = new Image();
      image.src = card.thumbnail;
    });
  }, [cards, side]);
  useEffect(() => {
    if (!cards.length) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const cardName = params.get("card");

    if (!cardName) {
      return;
    }

    const foundCard = cards.find(
      (card) => normalizeText(card.card_name) === normalizeText(cardName),
    );

    if (foundCard) {
      const normalizedSide = normalizeText(foundCard.side);

      if (normalizedSide === "zombie" || normalizedSide === "zombies") {
        setSide("Zombies");
      } else {
        setSide("Plants");
      }

      setSelectedCard(foundCard);
    }
  }, [cards]);

  const heroes = useMemo(() => {
    const selectedSide = normalizeText(side);

    return cards.filter((card) => {
      const cardSide = normalizeText(card.side);

      if (selectedSide === "plants") {
        return cardSide === "plant" || cardSide === "plants";
      }

      if (selectedSide === "zombies") {
        return cardSide === "zombie" || cardSide === "zombies";
      }

      return false;
    });
  }, [cards, side]);

  const renderCard = (card) => (
    <div className="card-item" key={card.cardid}>
      <div className="card-item-media">
        <img
          src={card.thumbnail}
          alt={card.card_name || "Hero"}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="card-item-info">
        <h2 className="card-item-title">
          {card.title
            ? renderTitleText(card.title)
            : card.card_name || "Unknown Hero"}
        </h2>

        {card.card_type && (
          <p>
            <span>Class:</span> {renderTitleText(card.card_type)}
          </p>
        )}

        {card.traits && (
          <p className="card-traits-line">
            <span className="card-field-label">Traits:</span>{" "}
            {renderTraitText(card.traits)}
          </p>
        )}

        {card.stats && (
          <p className="card-stats-line">
            <span className="card-field-label">Stats:</span>{" "}
            {renderStatsText(card.stats)}
          </p>
        )}

        {card.set_rarity && (
          <p>
            <span>Rarity:</span> {getRarityName(card.set_rarity)}
          </p>
        )}

        {card.ability && (
          <p className="card-description-line">
            <span className="card-field-label">Ability:</span>{" "}
            <span style={{ whiteSpace: "pre-line" }}>
              {renderAbilityText(card.ability)}
            </span>
          </p>
        )}

        {card.description && (
          <p className="card-description-line">
            {renderAbilityText(card.description)}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setSelectedCard(card);

            const url = new URL(window.location.href);

            url.searchParams.set("card", card.card_name);

            window.history.pushState(
              {
                card: card.card_name,
              },
              "",
              url,
            );
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>
            Loading heroes
            <span className="loading-dots">
              <span />
              <span />
              <span />
            </span>
          </h2>

          <p>Preparing the hero browser and loading available heroes.</p>

          <div className="loading-status">
            <span>Loading hero data</span>

            <strong>
              {totalHeroes > 0 ? `${totalHeroes} heroes` : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <head>
        <link
          rel="icon"
          href="https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp"
        />
        <title>Hero Info</title>
      </head>

      <Navbar />

      <div className="card-information-page">
        <h1>Hero Information</h1>

        <div className="card-side-tabs">
          <button
            type="button"
            className={side === "Plants" ? "active" : ""}
            onClick={() => setSide("Plants")}
          >
            Plants
          </button>

          <button
            type="button"
            className={side === "Zombies" ? "active" : ""}
            onClick={() => setSide("Zombies")}
          >
            Zombies
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {!error && (
          <>
            <h2>Heroes</h2>

            <p className="card-results-count">
              Showing {heroes.length} {side} heroes
            </p>

            {heroes.length === 0 ? (
              <p className="no-card-results">No {side} heroes found.</p>
            ) : (
              <div className="card-grid">{heroes.map(renderCard)}</div>
            )}
          </>
        )}

        {selectedCard && (
          <CardModal
            card={selectedCard}
            close={() => {
              if (window.history.state?.card) {
                window.history.back();
              } else {
                setSelectedCard(null);

                const url = new URL(window.location.href);

                url.searchParams.delete("card");

                window.history.replaceState({}, "", url);
              }
            }}
          />
        )}
      </div>
      <Footer credits="Special thanks to The_Cute_Chick, otherwise known as TCC, for uploading all of the hero images and transcribing most of the initial hero information used here." />
    </>
  );
}

export default HeroInfo;
