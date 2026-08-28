import { useEffect, useMemo, useState } from "react";

import CardModal from "../components/cardmodal";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

import "../css/cardinfo.css";
import "../css/navbar.css";
import "../css/loading.css";

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

const HERO_CACHE_KEY = "tbot_hero_info_cache";
const CARD_CACHE_KEY = "tbot_card_info_cache";

const HERO_CACHE_DURATION = 24 * 60 * 60 * 1000;

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

const getCachedData = (key) => {
  try {
    const cached = sessionStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    if (!Array.isArray(parsed?.results)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error);

    return null;
  }
};

function HeroInfo() {
  const initialHeroCache = getCachedData(HERO_CACHE_KEY);

  const initialCardCache = getCachedData(CARD_CACHE_KEY);

  const [cards, setCards] = useState(initialHeroCache?.results || []);

  const [allCards, setAllCards] = useState(initialCardCache?.results || []);

  const [side, setSide] = useState("Plants");

  const [selectedCard, setSelectedCard] = useState(null);

  const [loading, setLoading] = useState(!initialHeroCache?.results?.length);

  const [error, setError] = useState("");

  const [totalHeroes, setTotalHeroes] = useState(
    Number(initialHeroCache?.count) || initialHeroCache?.results?.length || 0,
  );

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

    return (
      <span className="trait-rendered">
        {String(text)
          .replace(/<:[^:>]+:\d+>/gi, "")
          .replace(/\*\*/g, "")
          .replace(/__/g, "")
          .trim()}
      </span>
    );
  };

  const getSuperpowerCards = (hero) => {
    if (!hero?.ability || !Array.isArray(allCards) || allCards.length === 0) {
      return [];
    }

    const CLASS_EMOJI_NAMES = new Set([
      "guardian",
      "kabloom",
      "megagrow",
      "smarty",
      "solar",
      "beastly",
      "brainy",
      "crazy",
      "hearty",
      "sneaky",
    ]);

    /*
     * Normalize text specifically for matching card names.
     *
     * This also makes straight and curly apostrophes equivalent:
     *
     *   Slammin' Smackdown
     *   Slammin’ Smackdown
     */
    const normalizeCardName = (value) =>
      String(value ?? "")
        .replace(/[’‘]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/<:[^:>]+:\d+>/gi, "")
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    /*
     * Return true when an emoji is one of the ten PvZH classes.
     */
    const isClassEmoji = (emojiName) => {
      const normalized = String(emojiName || "")
        .toLowerCase()
        .replace(/[-_\s]/g, "");

      return CLASS_EMOJI_NAMES.has(normalized);
    };

    /*
     * We want the longest card names first.
     *
     * This prevents a shorter card name from being selected when
     * another card has a longer matching name.
     */
    const sortedCards = [...allCards]
      .filter((card) => card?.card_name)
      .sort(
        (a, b) =>
          normalizeCardName(b.card_name).length -
          normalizeCardName(a.card_name).length,
      );

    const result = [];

    const ability = String(hero.ability);

    /*
     * Examine each line individually.
     *
     * A superpower heading is identified by a class emoji appearing
     * immediately after its name.
     *
     * This works for both:
     *
     *   Heroic Health <:Hearty:...>
     *
     * and:
     *
     *   A Zombie gets +2 Health. Slammin' Smackdown <:Hearty:...><:Beastly:...>
     */
    const lines = ability.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      /*
       * Find every Discord emoji on this line.
       */
      const emojiMatches = [...line.matchAll(/<:([^:>]+):\d+>/gi)];

      /*
       * Only inspect positions where the emoji is a class emoji.
       */
      const classEmojiMatches = emojiMatches.filter((match) =>
        isClassEmoji(match[1]),
      );

      if (classEmojiMatches.length === 0) {
        continue;
      }

      /*
       * Each class emoji can mark the end of a superpower heading.
       *
       * For example:
       *
       * "A Zombie gets +2 Health. Slammin' Smackdown <:Hearty:...>"
       *
       * The text before the emoji is:
       *
       * "A Zombie gets +2 Health. Slammin' Smackdown"
       *
       * We then check whether that text ENDS with a known card name.
       */
      for (const emojiMatch of classEmojiMatches) {
        const emojiIndex = emojiMatch.index;

        if (typeof emojiIndex !== "number") {
          continue;
        }

        const textBeforeEmoji = line.slice(0, emojiIndex);

        const normalizedBeforeEmoji = normalizeCardName(textBeforeEmoji);

        /*
         * Find the card whose name is the suffix of the text
         * immediately before the class emoji.
         */
        const matchingCard = sortedCards.find((card) => {
          const normalizedName = normalizeCardName(card.card_name);

          if (!normalizedName) {
            return false;
          }

          if (!normalizedBeforeEmoji.endsWith(normalizedName)) {
            return false;
          }

          /*
           * Make sure the card name starts at a sensible word
           * boundary rather than matching the tail of another word.
           */
          const startIndex =
            normalizedBeforeEmoji.length - normalizedName.length;

          if (startIndex === 0) {
            return true;
          }

          const characterBefore = normalizedBeforeEmoji[startIndex - 1];

          return /\s/.test(characterBefore);
        });

        if (
          matchingCard &&
          !result.some((card) => card.cardid === matchingCard.cardid)
        ) {
          result.push(matchingCard);
        }

        /*
         * Heroes have four superpowers.
         */
        if (result.length === 4) {
          return result;
        }
      }
    }

    return result;
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadHeroes = async () => {
      let hasCachedHeroes = false;
      let hasCachedCards = false;

      try {
        setError("");

        const cachedHeroes = getCachedData(HERO_CACHE_KEY);

        if (cachedHeroes?.results?.length) {
          hasCachedHeroes = true;

          setCards(cachedHeroes.results);
          setTotalHeroes(
            Number(cachedHeroes.count) || cachedHeroes.results.length,
          );

          setLoading(false);

          const age = Date.now() - Number(cachedHeroes.timestamp || 0);

          if (age < HERO_CACHE_DURATION) {
            /*
             * Heroes are fresh, but we still
             * need all card data if it isn't
             * already cached.
             */
          }
        }

        const cachedCards = getCachedData(CARD_CACHE_KEY);

        if (cachedCards?.results?.length) {
          hasCachedCards = true;
          setAllCards(cachedCards.results);
        }

        const requests = [];

        if (!hasCachedHeroes) {
          requests.push(
            fetch(`${API_BASE_URL}/tbotapp/heroinfo/`, {
              signal: controller.signal,
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(
                  `Hero request failed with status ${response.status}`,
                );
              }

              return response.json();
            }),
          );
        } else {
          requests.push(null);
        }

        if (!hasCachedCards) {
          requests.push(
            fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
              signal: controller.signal,
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(
                  `Card request failed with status ${response.status}`,
                );
              }

              return response.json();
            }),
          );
        } else {
          requests.push(null);
        }

        const [heroData, cardData] = await Promise.all(requests);

        if (heroData) {
          const heroResults = Array.isArray(heroData?.results)
            ? heroData.results
            : Array.isArray(heroData)
              ? heroData
              : [];

          const heroCount = Number(heroData?.count) || heroResults.length;

          if (heroResults.length > 0) {
            setCards(heroResults);
            setTotalHeroes(heroCount);

            sessionStorage.setItem(
              HERO_CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                count: heroCount,
                results: heroResults,
              }),
            );
          }
        }

        if (cardData) {
          const cardResults = Array.isArray(cardData)
            ? cardData
            : Array.isArray(cardData?.results)
              ? cardData.results
              : [];

          if (cardResults.length > 0) {
            setAllCards(cardResults);

            sessionStorage.setItem(
              CARD_CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                results: cardResults,
              }),
            );
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Hero loading failed:", err);

        if (!hasCachedHeroes) {
          setCards([]);
          setTotalHeroes(0);
          setError(
            `Unable to load heroes right now. ${err.message || ""}`.trim(),
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

    cards
      .filter((card) => {
        const cardSide = normalizeText(card.side);

        const selectedSide = normalizeText(side);

        if (selectedSide === "plants") {
          return cardSide === "plant" || cardSide === "plants";
        }

        return cardSide === "zombie" || cardSide === "zombies";
      })
      .forEach((card) => {
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

      return cardSide === "zombie" || cardSide === "zombies";
    });
  }, [cards, side]);

  const renderCard = (card) => {
    const superpowers = getSuperpowerCards(card);

    return (
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

          {superpowers.length > 0 && (
            <div className="card-superpowers">
              <span className="card-field-label">Superpowers:</span>

              <div className="card-superpowers-grid">
                {superpowers.map((superpower) => (
                  <button
                    type="button"
                    key={superpower.cardid}
                    className="card-superpower-button"
                    title={superpower.card_name}
                    onClick={() => {
                      setSelectedCard(superpower);

                      const url = new URL(window.location.href);

                      url.searchParams.set("card", superpower.card_name);

                      window.history.pushState(
                        {
                          card: superpower.card_name,
                        },
                        "",
                        url,
                      );
                    }}
                  >
                    <img
                      src={superpower.thumbnail}
                      alt={superpower.card_name}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            </div>
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
  };

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
            allCards={allCards}
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
