
import { useEffect, useMemo, useState } from "react";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

import "../css/decklists.css";
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

const ARCHETYPE_META = {
  aggro: {
    icon: "⚡",
    description:
      "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7.",
  },
  combo: {
    icon: "🧩",
    description:
      "Uses a specific card synergy to do massive damage to the opponent (OTK or One Turn Kill decks).",
  },
  midrange: {
    icon: "⚖️",
    description:
      "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game.",
  },
  control: {
    icon: "🛡️",
    description:
      "Focuses on removal and card advantage, winning in the late game.",
  },
  tempo: {
    icon: "🏃",
    description:
      "Focuses on slowly building a big board, winning trades and overwhelming the opponent.",
  },
};

const CATEGORY_META = {
  budget: {
    icon: "💵",
    description: "Decks that are cheap for new players",
  },
  competitive: {
    icon: "🏆",
    description: "Some of the best decks in the game",
  },
  ladder: {
    icon: "🪜",
    description: "Decks that are mostly only good for ranked games",
  },
  meme: {
    icon: "😂",
    description: "Decks built for fun or unusual combos",
  },
};

const HERO_ALIAS = {
  bc: "beta-carrotina",
  ct: "citron",
  sf: "solar flare",
  cz: "chompzilla",
  gs: "green shadow",
  gk: "grass knuckles",
  sp: "spudow",
  nc: "night cap",
  ro: "rose",
  cc: "captain combustible",
  sb: "super brainz",
  sm: "the smash",
  if: "impfinity",
  rb: "rustbolt",
  eb: "electric boogaloo",
  bf: "brain freeze",
  pb: "professor brainstorm",
  im: "immorticia",
  zm: "z-mech",
  nt: "neptuna",
  hg: "huge-giganticus",
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function parseCardNames(value) {
  if (value === null || value === undefined) {
    return [];
  }

  let cards = String(value);

  cards = cards.replace(/\\\r\\\n/g, "\n");
  cards = cards.replace(/\\\n/g, "\n");
  cards = cards.replace(/\\\r/g, "\n");

  return cards
    .split(/\r?\n|,/)
    .map((card) => card.trim())
    .filter(Boolean);
}

function normalizeCardSearchValue(value) {
  return parseCardNames(value)
    .map((card) => normalizeKey(card))
    .filter(Boolean);
}

function LegacyDecksPage() {
  const [decks, setDecks] = useState([]);
  const [totalDecks, setTotalDecks] = useState(0);
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countLoaded, setCountLoaded] = useState(false);
  const [decksLoaded, setDecksLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Legacy Decks";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchLegacyCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/legacy-decklist-count/`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Legacy deck count request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        if (mounted) {
          const count = Number(data?.count);

          if (Number.isFinite(count) && count >= 0) {
            setTotalDecks(count);
          }

          setCountLoaded(true);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load legacy deck count:", err);

          if (mounted) {
            setCountLoaded(true);
          }
        }
      }
    };

    fetchLegacyCount();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchLegacyDecks = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/legacy-decklists/`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          let message = `Legacy deck request failed with status ${response.status}`;

          try {
            const payload = await response.json();

            if (payload?.detail) {
              message += `: ${payload.detail}`;
            } else if (payload?.error) {
              message += `: ${payload.error}`;
            }
          } catch {
            // Ignore invalid JSON.
          }

          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        if (!contentType.includes("application/json")) {
          throw new Error(
            "The legacy decklist endpoint did not return JSON.",
          );
        }

        const data = await response.json();

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        const normalizedResults = results.map((deck) => ({
          ...deck,
          cards: deck?.cards ?? "",
        }));

        if (!mounted) {
          return;
        }

        setDecks(normalizedResults);
        setError("");
        setDecksLoaded(true);

        if (totalDecks === 0 && normalizedResults.length > 0) {
          setTotalDecks(normalizedResults.length);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load legacy decklists:", err);

        if (mounted) {
          setError(
            `Unable to load legacy decklists right now. ${
              err.message || ""
            }`.trim(),
          );

          setDecksLoaded(true);
        }
      }
    };

    fetchLegacyDecks();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [totalDecks]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchCards = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/cardinfo/`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          console.error(
            `Card information request failed with status ${response.status}`,
          );
          return;
        }

        const data = await response.json();

        if (mounted) {
          setAllCards(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load card information:", err);
        }
      }
    };

    fetchCards();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (countLoaded && decksLoaded) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [countLoaded, decksLoaded]);

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeKey(side);

    return decks.filter(
      (deck) => normalizeKey(deck.side) === selectedSide,
    );
  }, [decks, side]);

  const heroOptions = useMemo(() => {
    const heroMap = new Map();

    sideFilteredDecks.forEach((deck) => {
      const heroName = normalizeText(deck.hero);

      if (!heroName) {
        return;
      }

      const key = normalizeKey(heroName);

      if (!heroMap.has(key)) {
        heroMap.set(key, {
          value: heroName,
          label: heroName,
          count: 0,
          side: normalizeKey(deck.side),
        });
      }

      heroMap.get(key).count += 1;
    });

    return Array.from(heroMap.values())
      .map((option) => {
        const matchedCard = allCards.find(
          (card) =>
            normalizeKey(card?.card_name) ===
            normalizeKey(option.label),
        );

        return {
          ...option,
          description: matchedCard?.flavor_text || "",
          image: matchedCard?.thumbnail || "",
        };
      })
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
        }),
      );
  }, [sideFilteredDecks, allCards]);

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();

    sideFilteredDecks.forEach((deck) => {
      const categoryName = normalizeText(deck.category);

      if (!categoryName) {
        return;
      }

      const key = normalizeKey(categoryName);

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          value: categoryName,
          label:
            categoryName.charAt(0).toUpperCase() +
            categoryName.slice(1),
          count: 0,
          ...(CATEGORY_META[key] || {}),
        });
      }

      categoryMap.get(key).count += 1;
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
  }, [sideFilteredDecks]);

  const archetypeOptions = useMemo(() => {
    const counts = {};

    Object.keys(ARCHETYPE_META).forEach((key) => {
      counts[key] = 0;
    });

    sideFilteredDecks.forEach((deck) => {
      const deckArchetype = normalizeKey(deck.archetype);

      if (!deckArchetype) {
        return;
      }

      Object.keys(ARCHETYPE_META).forEach((archetypeName) => {
        if (deckArchetype.includes(archetypeName)) {
          counts[archetypeName] += 1;
        }
      });
    });

    return Object.entries(ARCHETYPE_META)
      .map(([value, meta]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count: counts[value] || 0,
        ...meta,
      }))
      .filter((option) => option.count > 0);
  }, [sideFilteredDecks]);

  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      const sideOrder = {
        plants: 0,
        zombies: 1,
      };

      const sideA = normalizeKey(a.side);
      const sideB = normalizeKey(b.side);

      const sideCompare =
        (sideOrder[sideA] ?? 99) -
        (sideOrder[sideB] ?? 99);

      if (sideCompare !== 0) {
        return sideCompare;
      }

      const heroCompare = normalizeText(a.hero).localeCompare(
        normalizeText(b.hero),
        undefined,
        {
          sensitivity: "base",
        },
      );

      if (heroCompare !== 0) {
        return heroCompare;
      }

      return normalizeText(a.name).localeCompare(
        normalizeText(b.name),
        undefined,
        {
          sensitivity: "base",
        },
      );
    });
  }, [decks]);

  const filteredDecks = useMemo(() => {
    const searchValue = normalizeKey(search);

    const alias = HERO_ALIAS[searchValue]
      ? normalizeKey(HERO_ALIAS[searchValue])
      : "";

    return sortedDecks.filter((deck) => {
      const deckCards = normalizeCardSearchValue(deck.cards);

      const searchableValues = [
        deck.name,
        deck.creator,
        deck.optimization,
        deck.hero,
        deck.archetype,
        deck.category,
      ]
        .filter(Boolean)
        .map((value) => normalizeKey(value));

      searchableValues.push(...deckCards);

      const searchMatch =
        !searchValue ||
        (alias
          ? normalizeKey(deck.hero).includes(alias)
          : searchableValues.some((value) =>
              value.includes(searchValue),
            ));

      const deckSide = normalizeKey(deck.side);

      const sideMatch =
        side === "All" ||
        deckSide === normalizeKey(side);

      const heroMatch =
        hero.length === 0 ||
        hero.some(
          (selectedHero) =>
            normalizeKey(deck.hero) ===
            normalizeKey(selectedHero.value),
        );

      const categoryMatch =
        category.length === 0 ||
        category.some(
          (selectedCategory) =>
            normalizeKey(deck.category) ===
            normalizeKey(selectedCategory.value),
        );

      const deckArchetype = normalizeKey(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          deckArchetype.includes(
            normalizeKey(selectedArchetype.value),
          ),
        );

      return (
        searchMatch &&
        sideMatch &&
        heroMatch &&
        categoryMatch &&
        archetypeMatch
      );
    });
  }, [
    sortedDecks,
    search,
    side,
    hero,
    category,
    archetype,
  ]);

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading legacy decks</h2>

          <p>
            Preparing the legacy deck browser and loading available
            decks.
          </p>

          <div className="loading-status">
            <span>Legacy decks available</span>

            <strong>
              {countLoaded
                ? `${totalDecks} decks`
                : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-page">
      <Navbar />

      <main className="deck-content">
        <h1>Legacy Decks</h1>

        <div className="deck-browser">
          <div className="tabs">
            <button
              type="button"
              className={side === "All" ? "active" : ""}
              onClick={() => handleSideChange("All")}
            >
              All
            </button>

            <button
              type="button"
              className={side === "Plants" ? "active" : ""}
              onClick={() => handleSideChange("Plants")}
            >
              <img
                src="https://i.ibb.co/fYHsRqP0/plants.png"
                alt="Plants"
                className="tab-icon"
              />
              Plants
            </button>

            <button
              type="button"
              className={side === "Zombies" ? "active" : ""}
              onClick={() => handleSideChange("Zombies")}
            >
              <img
                src="https://i.ibb.co/pvT38Y1n/zombies.png"
                alt="Zombies"
                className="tab-icon"
              />
              Zombies
            </button>
          </div>

          <div className="search-container">
            <input
              className="search"
              placeholder="Search legacy decks, creators, heroes, cards..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="filters">
            <div className="select-wrapper">
              <FilterDropdown
                label="Hero"
                options={heroOptions}
                value={hero}
                onChange={setHero}
                multi
              />
            </div>

            <div className="select-wrapper">
              <FilterDropdown
                label="Category"
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                multi
              />
            </div>

            <div className="select-wrapper archetype-select-wrapper">
              <FilterDropdown
                label="Archetype"
                options={archetypeOptions}
                value={archetype}
                onChange={setArchetype}
                multi
              />
            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>

        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <p className="results-count">
            Showing {filteredDecks.length} of{" "}
            {totalDecks || decks.length} legacy decks
          </p>
        )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">
            No legacy decks found.
          </p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map((deck, index) => (
                <DeckCard
                  key={
                    deck.deckid ??
                    deck.deckID ??
                    `${deck.side}-${deck.hero}-${deck.name}-${index}`
                  }
                  decklist={deck}
                  allCards={allCards}
                />
              ))}
            </div>
          )
        )}
      </main>

      <Footer credits />
    </div>
  );
}

export default LegacyDecksPage;
