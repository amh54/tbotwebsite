import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import DeckCard from "../components/deckcomponent";
import "../css/decklists.css";

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
  const [archetype, setArchetype] = useState(null);
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
      "&:hover": {
        borderColor: "#8fe38b",
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#202020",
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
            // Ignore non-JSON error payloads and keep status-based message.
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
            `Unexpected response type (${contentType || "unknown"}) from ${decklistsEndpoint}. ${hint}`,
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
            `Unable to load decklists right now.${hint} ${err.message || ""}`.trim(),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();

    return () => controller.abort();
  }, []);

  const heroOptions = [
    ...new Set(decks.map((deck) => deck.hero).filter(Boolean)),
  ].map((hero) => ({
    value: hero,
    label: hero,
  }));

  const archetypeOptions = [
    ...new Set(decks.map((deck) => deck.archetype).filter(Boolean)),
  ]
    .map((archetype) => ({
      value: archetype,
      label: archetype,
    }))
    .sort((a, b) =>
      (a.label || "").localeCompare(b.label || "", undefined, {
        sensitivity: "base",
      }),
    );

  const categoryOptions = Object.values(
    decks.reduce((acc, deck) => {
      const normalizedCategory = normalizeFilterText(deck.category);
      if (!normalizedCategory) {
        return acc;
      }

      const categoryKey = normalizeFilterKey(normalizedCategory);
      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          value: normalizedCategory,
          label: normalizedCategory,
        };
      }

      return acc;
    }, {}),
  ).sort((a, b) =>
    (a.label || "").localeCompare(b.label || "", undefined, {
      sensitivity: "base",
    }),
  );

  const sortedDecks = [...decks].sort((a, b) => {
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

    const heroCompare = (a.hero || "").localeCompare(b.hero || "", undefined, {
      sensitivity: "base",
    });

    if (heroCompare !== 0) {
      return heroCompare;
    }

    return (a.name || "").localeCompare(b.name || "", undefined, {
      sensitivity: "base",
    });
  });

  const filteredDecks = sortedDecks.filter((deck) => {
    const searchValue = String(search || "")
      .trim()
      .toLowerCase();
    const heroAliasMatch = (HERO_ALIAS[searchValue] || "").toLowerCase();
    const expandedSearchValue = heroAliasMatch || searchValue;
    const isHeroShortcutSearch = Boolean(heroAliasMatch);

    const searchMatch = isHeroShortcutSearch
      ? deck.hero?.toLowerCase().includes(expandedSearchValue)
      : deck.name?.toLowerCase().includes(expandedSearchValue) ||
        deck.creator?.toLowerCase().includes(expandedSearchValue) ||
        deck.optimization?.toLowerCase().includes(expandedSearchValue) ||
        deck.hero?.toLowerCase().includes(expandedSearchValue) ||
        deck.archetype?.toLowerCase().includes(expandedSearchValue) ||
        deck.cards?.toLowerCase().includes(expandedSearchValue);

    const sideValue = (deck.side || "").toLowerCase();

    const sideMatch =
      side === "All" ||
      (side === "Plants" && sideValue === "plants") ||
      (side === "Zombies" && sideValue === "zombies");

    const heroMatch = !hero || deck.hero === hero.value;

    const archetypeMatch =
      !archetype ||
      (deck.archetype || "")
        .toLowerCase()
        .includes(archetype.value.toLowerCase());
    const categoryMatch =
      !category ||
      normalizeFilterKey(deck.category) === normalizeFilterKey(category.value);

    return (
      searchMatch && sideMatch && heroMatch && archetypeMatch && categoryMatch
    );
  });

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
          <Link to="/cardinformation">Card Information</Link>
          <Link to="/keeporscrap"> Keep or Scrap</Link>
        </div>
      </nav>

      <h1>Decklists</h1>

      <div className="deck-browser">
        <div className="tabs">
          <button
            type="button"
            className={side === "All" ? "active" : ""}
            onClick={() => setSide("All")}
          >
            All
          </button>

          <button
            type="button"
            className={side === "Plants" ? "active" : ""}
            onClick={() => setSide("Plants")}
          >
            <img
              src="https://i.ibb.co/fYHsRqP0/plants.png"
              alt="Plants"
              className="tab-icon"
            />{" "}
            Plants
          </button>

          <button
            type="button"
            className={side === "Zombies" ? "active" : ""}
            onClick={() => setSide("Zombies")}
          >
            <img
              src="https://i.ibb.co/pvT38Y1n/zombies.png"
              alt="Zombies"
              className="tab-icon"
            />{" "}
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
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Hero"
              options={heroOptions}
              value={hero}
              onChange={setHero}
              isClearable
            />
          </div>

          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Category"
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              isClearable
            />
          </div>
          <div className="select-wrapper">
            <Select
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Archetype"
              options={archetypeOptions}
              value={archetype}
              onChange={setArchetype}
              isClearable
            />
          </div>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => {
              setSearch("");

              setHero(null);

              setArchetype(null);

              setCategory(null);
            }}
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
    </div>
  );
}

export default DecklistsPage;
