import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";

import "../css/decklists.css";
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

const getCookie = (name) => {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
};

const ensureCsrfToken = async () => {
  let csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      "Unable to initialize CSRF protection. Please refresh the page.",
    );
  }

  csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Please refresh the page and try again.",
    );
  }

  return csrfToken;
};

const getApiErrorMessage = async (response, fallback) => {
  let message = fallback;

  try {
    const data = await response.json();

    if (data?.detail) {
      message += `: ${data.detail}`;
    } else if (data?.error) {
      message += `: ${data.error}`;
    } else if (data?.fields) {
      const fieldMessages = Object.entries(data.fields)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(", ")
            : String(messages);

          return `${field}: ${text}`;
        })
        .join(" | ");

      if (fieldMessages) {
        message += `: ${fieldMessages}`;
      }
    }
  } catch {
    // Ignore invalid JSON.
  }

  return message;
};

function LegacyDecksAdmin() {
  const [decks, setDecks] = useState([]);
  const [allCards, setAllCards] = useState([]);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");

  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cardsError, setCardsError] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    document.title = "Admin - Legacy Decks";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error("Unable to initialize CSRF:", err);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDecks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/legacy-decklists/`,
          {
            method: "GET",
            signal: controller.signal,
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            `Request failed with status ${response.status}`,
          );

          if (response.status === 401) {
            throw new Error(
              "You must be logged in with Discord to access the admin page.",
            );
          }

          if (response.status === 403) {
            throw new Error(
              "Owner permissions are required to access legacy decks.",
            );
          }

          throw new Error(message);
        }

        const data = await response.json();

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        setDecks(results);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load admin legacy decks:", err);
          setError(err.message || "Unable to load legacy decks right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDecks();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        setCardsError("");

        const response = await fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
          method: "GET",
          signal: controller.signal,
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response,
              `Card list request failed with status ${response.status}`,
            ),
          );
        }

        const data = await response.json();

        setAllCards(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [],
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load card information:", err);

          setCardsError(
            err.message || "Unable to load card information right now.",
          );
        }
      }
    };

    fetchCards();

    return () => controller.abort();
  }, []);

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    return decks.filter(
      (deck) => normalizeKey(deck.side) === normalizeKey(side),
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
          (card) => normalizeKey(card.card_name) === normalizeKey(option.label),
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
          label: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
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

      const sideCompare = (sideOrder[sideA] ?? 99) - (sideOrder[sideB] ?? 99);

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
      const searchableValues = [
        deck.name,
        deck.creator,
        deck.optimization,
        deck.hero,
        deck.archetype,
        deck.category,
        deck.cards,
      ]
        .filter(Boolean)
        .map((value) => normalizeKey(value));

      const searchMatch =
        !searchValue ||
        (alias
          ? normalizeKey(deck.hero).includes(alias)
          : searchableValues.some((value) => value.includes(searchValue)));

      const sideMatch =
        side === "All" || normalizeKey(deck.side) === normalizeKey(side);

      const heroMatch =
        hero.length === 0 ||
        hero.some(
          (selectedHero) =>
            normalizeKey(deck.hero) === normalizeKey(selectedHero.value),
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
          deckArchetype.includes(normalizeKey(selectedArchetype.value)),
        );

      return (
        searchMatch && sideMatch && heroMatch && categoryMatch && archetypeMatch
      );
    });
  }, [sortedDecks, search, side, hero, category, archetype]);

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

  const handleEdit = async (deck, form) => {
    if (!deck) {
      return null;
    }

    const deckId = deck.deckid ?? deck.deckID ?? deck.id;

    if (!deckId) {
      throw new Error("Unable to determine the legacy deck ID.");
    }

    setEditSaving(true);
    setEditError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const formData = new FormData();

      formData.append("name", form?.name ?? "");
      formData.append("hero", form?.hero ?? "");
      formData.append("side", form?.side ?? "");
      formData.append("category", form?.category ?? "");
      formData.append("archetype", form?.archetype ?? "");
      formData.append("description", form?.description ?? "");
      formData.append("creator", form?.creator ?? "");
      formData.append("cost", form?.cost ?? "");
      formData.append("inspiration", form?.inspiration ?? "");
      formData.append("optimization", form?.optimization ?? "");
      formData.append("suggested_date", form?.suggested_date ?? "");
      formData.append("updated_date", form?.updated_date ?? "");
      formData.append("deck_doc", form?.deck_doc ?? "");
      formData.append("cards", form?.cards ?? "");

      if (form?.image_file instanceof File) {
        formData.append("image_file", form.image_file);
      }

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/legacy-decklists/${encodeURIComponent(
          deckId,
        )}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Update failed with status ${response.status}`,
        );

        if (response.status === 403) {
          throw new Error(
            "Owner permissions are required to edit legacy decks.",
          );
        }

        throw new Error(message);
      }

      const updatedDeck = await response.json();

      setDecks((currentDecks) =>
        currentDecks.map((currentDeck) => {
          const currentId =
            currentDeck.deckid ?? currentDeck.deckID ?? currentDeck.id;

          return String(currentId) === String(deckId)
            ? {
                ...currentDeck,
                ...updatedDeck,
              }
            : currentDeck;
        }),
      );

      setEditError("");

      return updatedDeck;
    } catch (err) {
      console.error("Unable to update legacy deck:", err);

      setEditError(err.message || "Unable to update legacy deck.");

      throw err;
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (deck) => {
    const deckId = deck.deckid ?? deck.deckID ?? deck.id;

    if (!deckId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        deck.name || "this legacy deck"
      }"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/legacy-decklists/${encodeURIComponent(
          deckId,
        )}/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
        },
      );

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Delete failed with status ${response.status}`,
        );

        if (response.status === 403) {
          throw new Error(
            "Owner permissions are required to delete legacy decks.",
          );
        }

        throw new Error(message);
      }

      setDecks((currentDecks) =>
        currentDecks.filter((currentDeck) => {
          const currentId =
            currentDeck.deckid ?? currentDeck.deckID ?? currentDeck.id;

          return String(currentId) !== String(deckId);
        }),
      );
    } catch (err) {
      console.error("Unable to delete legacy deck:", err);

      setDeleteError(err.message || "Unable to delete legacy deck.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading legacy decks</h2>

          <p>Preparing the legacy deck manager and loading available decks.</p>

          <div className="loading-status">
            <span>Loading legacy deck data</span>
            <strong>Loading...</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-page">
      <main className="deck-content">
        <div className="admin-decklists-topbar">
          <div>
            <h1>Legacy Decks</h1>

            <p className="admin-decklists-subtitle">
              Manage the legacy decklists available on Tbot.
            </p>
          </div>

          <div className="admin-decklists-actions">
            <Link to="/admin" className="admin-back-button">
              ← Admin
            </Link>

            <Link to="/admin/legacy-decklists/add" className="admin-add-button">
              + Add Legacy Deck
            </Link>
          </div>
        </div>

        {deleteError && <div className="admin-error">{deleteError}</div>}

        {editError && <div className="admin-error">{editError}</div>}

        {cardsError && (
          <div className="admin-error">Card list: {cardsError}</div>
        )}

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
              onChange={(event) => setSearch(event.target.value)}
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
          <div className="admin-error">{error}</div>
        ) : (
          <p className="results-count">
            Showing {filteredDecks.length} of {decks.length} legacy decks
          </p>
        )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No legacy decks found.</p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map((deck) => (
                <div
                  key={`${deck.side}-${deck.deckid || deck.id || deck.name}`}
                >
                  <DeckCard
                    decklist={deck}
                    admin
                    allCards={allCards}
                    onSave={handleEdit}
                    onDelete={handleDelete}
                    editSaving={editSaving}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {deleteLoading && (
        <div className="admin-delete-overlay">
          <div className="admin-delete-dialog">Deleting legacy deck...</div>
        </div>
      )}
    </div>
  );
}

export default LegacyDecksAdmin;
