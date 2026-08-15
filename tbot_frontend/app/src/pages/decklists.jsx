import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import "../css/decklists.css";
import "../css/navbar.css";

const getApiBaseUrl = () => {
  const stripTrailingSlashes = (value) => {
    let normalized = value;

    while (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  };

  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return stripTrailingSlashes(envBaseUrl);
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalhost) {
      return "http://localhost:8000";
    }
  }

  // On deployed frontends, fallback to same-origin route when API base URL is not set.
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
  budget: { icon: "💵", description: "Decks that are cheap for new players" },
  competitive: {
    icon: "🏆",
    description: "Some of the best decks in the game",
  },
  ladder: {
    icon: "🪜",
    description: "Decks that are mostly only good for ranked games",
  },
  meme: { icon: "😂", description: "Decks built for fun/weird combos" },
};

function DecklistsPage() {
  const normalizeFilterText = (value) => String(value || "").trim();

  const normalizeFilterKey = (value) =>
    normalizeFilterText(value).toLowerCase();

  const HERO_ALIAS = {
    bc: "beta-carrotina",
    ct: "citron",
    sf: "solar flare",
    cz: "Chompzilla",
    gs: "Green Shadow",
    gk: "Grass Knuckles",
    sp: "spudow",
    nc: "Night Cap",
    ro: "Rose",
    cc: "Captain Combustible",
    sb: "super brainz",
    sm: "The Smash",
    if: "Impfinity",
    rb: "Rustbolt",
    eb: "Electric Boogaloo",
    bf: "Brain Freeze",
    pb: "Professor Brainstorm",
    im: "Immorticia",
    zm: "Z-Mech",
    nt: "Neptuna",
    hg: "Huge-Giganticus",
  };

  const [decks, setDecks] = useState([]);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");

  const [hero, setHero] = useState(null);
  const [archetype, setArchetype] = useState([]);
  const [category, setCategory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "#202020",
      borderColor: state.isFocused ? "#8fe38b" : "#444",
      minHeight: "45px",
      boxShadow: "none",
      cursor: "pointer",

      "&:hover": {
        borderColor: "#8fe38b",
      },
    }),

    valueContainer: (base) => ({
      ...base,
      padding: "2px 10px",
    }),

    multiValue: (base) => ({
      ...base,
      backgroundColor: "#333",
      borderRadius: "5px",
    }),

    multiValueLabel: (base) => ({
      ...base,
      color: "white",
    }),

    multiValueRemove: (base) => ({
      ...base,
      color: "#aaa",

      "&:hover": {
        backgroundColor: "#8fe38b",
        color: "#101416",
      },
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: "#202020",
      zIndex: 9999,
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#333" : "#202020",
      color: "white",
      cursor: "pointer",
    }),

    singleValue: (base) => ({
      ...base,
      color: "white",
    }),

    placeholder: (base) => ({
      ...base,
      color: "#888",
    }),

    input: (base) => ({
      ...base,
      color: "white",
    }),
  };
  const [allCards, setAllCards] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tbotapp/cardinfo/`;

        const response = await fetch(endpoint, { signal: controller.signal });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setAllCards(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      }
    };

    fetchCards();

    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();

    const fetchDecks = async () => {
      try {
        const decklistsEndpoint = `${API_BASE_URL}/tbotapp/decklists/`;

        const response = await fetch(decklistsEndpoint, {
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
          } catch (_error) {
            // Ignore non-JSON error payloads.
          }

          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        const responseText = await response.text();

        const hint = import.meta.env.VITE_API_BASE_URL
          ? "Check that VITE_API_BASE_URL points to your backend domain."
          : "VITE_API_BASE_URL is missing; set it in frontend deployment settings.";

        if (!contentType.includes("application/json")) {
          const startsLikeHtml = responseText.trim().startsWith("<");

          if (startsLikeHtml) {
            throw new Error(
              `Received HTML instead of JSON from ${decklistsEndpoint}. ${hint}`,
            );
          }

          throw new Error(
            `Unexpected response type (${
              contentType || "unknown"
            }) from ${decklistsEndpoint}. ${hint}`,
          );
        }

        let data;

        try {
          data = JSON.parse(responseText);
        } catch (_parseError) {
          const startsLikeHtml = responseText.trim().startsWith("<");

          if (startsLikeHtml) {
            throw new Error(
              `Received HTML instead of JSON from ${decklistsEndpoint}. ${hint}`,
            );
          }

          throw new Error(
            `Invalid JSON received from ${decklistsEndpoint}. ${hint}`,
          );
        }

        setDecks(data || []);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);

          const hint = import.meta.env.VITE_API_BASE_URL
            ? ""
            : " Configure VITE_API_BASE_URL in your frontend deployment settings.";

          setError(
            `Unable to load decklists right now.${hint} ${
              err.message || ""
            }`.trim(),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();

    return () => controller.abort();
  }, []);
  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = side.toLowerCase();

    return decks.filter(
      (deck) => String(deck.side || "").toLowerCase() === selectedSide,
    );
  }, [decks, side]);
  const heroOptions = useMemo(() => {
    return [
      ...new Set(
        sideFilteredDecks
          .map((deck) => normalizeFilterText(deck.hero))
          .filter(Boolean),
      ),
    ]
      .map((heroName) => {
        const matchedCard = allCards.find(
          (card) =>
            normalizeFilterKey(card.card_name) === normalizeFilterKey(heroName),
        );

        return {
          value: heroName,
          label: heroName,
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
    const grouped = sideFilteredDecks.reduce((acc, deck) => {
      const normalized = normalizeFilterText(deck.category);
      if (!normalized) return acc;
      const key = normalizeFilterKey(normalized);
      if (!acc[key]) {
        acc[key] = {
          value: normalized,
          label: normalized,
          count: 0,
          ...CATEGORY_META[key],
        };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [sideFilteredDecks]);

  const archetypeOptions = useMemo(() => {
    return Object.entries(ARCHETYPE_META)
      .map(([value, meta]) => {
        const count = sideFilteredDecks.filter((deck) =>
          normalizeFilterKey(deck.archetype).includes(value),
        ).length;
        return {
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
          ...meta,
          count,
        };
      })
      .filter((opt) => opt.count > 0);
  }, [sideFilteredDecks]);

  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      const normalizeSide = (value) => String(value || "").toLowerCase();

      const sideOrder = {
        plants: 0,
        zombies: 1,
      };

      const sideCompare =
        (sideOrder[normalizeSide(a.side)] ?? 99) -
        (sideOrder[normalizeSide(b.side)] ?? 99);

      if (sideCompare !== 0) {
        return sideCompare;
      }

      const heroCompare = (a.hero || "").localeCompare(
        b.hero || "",
        undefined,
        {
          sensitivity: "base",
        },
      );

      if (heroCompare !== 0) {
        return heroCompare;
      }

      return (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      });
    });
  }, [decks]);
  const clearFilters = () => {
    setSearch("");
    setHero(null);
    setArchetype([]);
    setCategory(null);
  };
  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  const filteredDecks = useMemo(() => {
    return sortedDecks.filter((deck) => {
      const searchValue = String(search || "")
        .trim()
        .toLowerCase();

      const heroAliasMatch = (HERO_ALIAS[searchValue] || "").toLowerCase();

      const expandedSearchValue = heroAliasMatch || searchValue;

      const isHeroShortcutSearch = Boolean(heroAliasMatch);

      const searchableValues = [
        deck.name,
        deck.creator,
        deck.optimization,
        deck.hero,
        deck.archetype,
        deck.cards,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const searchMatch =
        !searchValue ||
        (isHeroShortcutSearch
          ? String(deck.hero || "")
              .toLowerCase()
              .includes(expandedSearchValue)
          : searchableValues.some((value) =>
              value.includes(expandedSearchValue),
            ));

      const sideValue = String(deck.side || "").toLowerCase();

      const sideMatch =
        side === "All" ||
        (side === "Plants" && sideValue === "plants") ||
        (side === "Zombies" && sideValue === "zombies");

      const heroMatch =
        !hero ||
        normalizeFilterKey(deck.hero) === normalizeFilterKey(hero.value);
      const deckArchetype = normalizeFilterKey(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          deckArchetype.includes(normalizeFilterKey(selectedArchetype.value)),
        );

      const categoryMatch =
        !category ||
        normalizeFilterKey(deck.category) ===
          normalizeFilterKey(category.value);

      return (
        searchMatch && sideMatch && heroMatch && archetypeMatch && categoryMatch
      );
    });
  }, [sortedDecks, search, side, hero, archetype, category]);

  if (loading) {
    return (
      <div className="deck-page">
        <h1>Loading Decklists...</h1>
      </div>
    );
  }

  return (
    <div className="deck-page">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">Tbot</Link>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/decklists">Decklists</Link>
          <Link to="/cardinfo">Card Info</Link>
          <Link to="/heroinfo">Hero Info</Link>
          <Link to="/keeporscrap">Keep or Scrap</Link>
        </div>
      </nav>

      <main className="deck-content">
        <h1>Decklists</h1>

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
              placeholder="Search decks, creators, heroes, cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters">
            <div className="select-wrapper">
              <FilterDropdown
                label="Hero"
                options={heroOptions}
                value={hero}
                onChange={setHero}
              />
            </div>

            <div className="select-wrapper">
              <FilterDropdown
                label="Category"
                options={categoryOptions}
                value={category}
                onChange={setCategory}
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
          <p className="results-count">Showing {filteredDecks.length} decks</p>
        )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No decklists found.</p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map((deck) => (
                <DeckCard
                  key={`${deck.side}-${deck.deckid || deck.id || deck.name}`}
                  decklist={deck}
                />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default DecklistsPage;
