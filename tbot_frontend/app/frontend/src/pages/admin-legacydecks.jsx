import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import Footer from "../components/footer";
import "../css/adminDecklists.css";

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
  let token = getCookie("csrftoken");

  if (token) {
    return token;
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to initialize CSRF protection.");
  }

  try {
    const data = await response.json();

    token = data?.csrfToken || data?.csrf_token || getCookie("csrftoken");
  } catch {
    token = getCookie("csrftoken");
  }

  if (!token) {
    throw new Error("CSRF token is missing.");
  }

  return token;
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
      const fields = Object.entries(data.fields)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(", ")
            : String(messages);

          return `${field}: ${text}`;
        })
        .join(" | ");

      if (fields) {
        message += `: ${fields}`;
      }
    }
  } catch {
    return message;
  }

  return message;
};

const ARCHETYPE_META = {
  aggro: {
    icon: "⚡",
    description:
      "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7.",
  },
  combo: {
    icon: "🧩",
    description:
      "Uses a specific card synergy to do massive damage to the opponent.",
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

const normalizeText = (value) => String(value ?? "").trim();

const normalizeKey = (value) => normalizeText(value).toLowerCase();

function AdminLegacyDecks() {

  const [decks, setDecks] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardsError, setCardsError] = useState("");

  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    document.title = "Admin - Legacy Decks";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error("CSRF initialization failed:", err);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCards = async () => {
      try {
        setCardsError("");

        const response = await fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response,
              `Card request failed with status ${response.status}`,
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
          console.error(err);
          setCardsError(err.message || "Unable to load card information.");
        }
      }
    };

    loadCards();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadDecks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/legacy-decklists/`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
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

          throw new Error(
            await getApiErrorMessage(
              response,
              `Request failed with status ${response.status}`,
            ),
          );
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
          console.error("Unable to load legacy decks:", err);
          setError(err.message || "Unable to load legacy decks.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDecks();

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
    const map = new Map();

    sideFilteredDecks.forEach((deck) => {
      const value = normalizeText(deck.hero);

      if (!value) {
        return;
      }

      const key = normalizeKey(value);

      if (!map.has(key)) {
        map.set(key, {
          value,
          label: value,
          count: 0,
        });
      }

      map.get(key).count += 1;
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
  }, [sideFilteredDecks]);

  const categoryOptions = useMemo(() => {
    const map = new Map();

    sideFilteredDecks.forEach((deck) => {
      const value = normalizeText(deck.category);

      if (!value) {
        return;
      }

      const key = normalizeKey(value);

      if (!map.has(key)) {
        map.set(key, {
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
          count: 0,
          ...(CATEGORY_META[key] || {}),
        });
      }

      map.get(key).count += 1;
    });

    return Array.from(map.values()).sort((a, b) =>
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
      const value = normalizeKey(deck.archetype);

      Object.keys(ARCHETYPE_META).forEach((key) => {
        if (value.includes(key)) {
          counts[key] += 1;
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
        .map(normalizeKey);

      const searchMatch =
        !searchValue ||
        searchableValues.some((value) => value.includes(searchValue));

      const sideMatch =
        side === "All" || normalizeKey(deck.side) === normalizeKey(side);

      const heroMatch =
        hero.length === 0 ||
        hero.some(
          (selected) =>
            normalizeKey(deck.hero) === normalizeKey(selected.value),
        );

      const categoryMatch =
        category.length === 0 ||
        category.some(
          (selected) =>
            normalizeKey(deck.category) === normalizeKey(selected.value),
        );

      const deckArchetype = normalizeKey(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selected) =>
          deckArchetype.includes(normalizeKey(selected.value)),
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

  const handleSave = async (deck, form) => {
    const deckId = deck.deckid ?? deck.deckID ?? deck.id;

    if (!deckId) {
      throw new Error("Unable to determine the legacy deck ID.");
    }

    setEditSaving(true);
    setEditError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const formData = new FormData();

      const fields = [
        "name",
        "hero",
        "side",
        "category",
        "archetype",
        "description",
        "creator",
        "cost",
        "inspiration",
        "optimization",
        "suggested_date",
        "updated_date",
        "deck_doc",
        "cards",
      ];

      fields.forEach((field) => {
        formData.append(field, form?.[field] ?? "");
      });

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
        throw new Error(
          await getApiErrorMessage(
            response,
            `Update failed with status ${response.status}`,
          ),
        );
      }

      const updatedDeck = await response.json();

      setDecks((current) =>
        current.map((item) => {
          const itemId = item.deckid ?? item.deckID ?? item.id;

          return String(itemId) === String(deckId)
            ? { ...item, ...updatedDeck }
            : item;
        }),
      );

      return updatedDeck;
    } catch (err) {
      setEditError(err.message || "Unable to update legacy deck.");
      throw err;
    } finally {
      setEditSaving(false);
    }
  };

  const handleAdd = async (form) => {
    setEditSaving(true);
    setEditError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const formData = new FormData();

      const fields = [
        "name",
        "hero",
        "side",
        "category",
        "archetype",
        "description",
        "creator",
        "cost",
        "inspiration",
        "optimization",
        "suggested_date",
        "updated_date",
        "deck_doc",
        "cards",
      ];

      fields.forEach((field) => {
        formData.append(field, form?.[field] ?? "");
      });

      if (form?.image_file instanceof File) {
        formData.append("image_file", form.image_file);
      }

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/legacy-decklists/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            `Creation failed with status ${response.status}`,
          ),
        );
      }

      const createdDeck = await response.json();

      setDecks((current) => [createdDeck, ...current]);
      setIsAddModalOpen(false);

      return createdDeck;
    } catch (err) {
      setEditError(err.message || "Unable to add legacy deck.");
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
        `${API_BASE_URL}/tbotapp/admin/legacy-decklists/${deckId}/delete/`,
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
        throw new Error(
          await getApiErrorMessage(
            response,
            `Delete failed with status ${response.status}`,
          ),
        );
      }

      setDecks((current) =>
        current.filter((item) => {
          const itemId = item.deckid ?? item.deckID ?? item.id;

          return String(itemId) !== String(deckId);
        }),
      );
    } catch (err) {
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

          <p>Preparing the legacy deck browser and loading available decks.</p>

          <div className="loading-status">
            <span>Loading legacy deck data</span>
            <strong>
              {decks.length > 0 ? `${decks.length} decks` : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  const blankDeck = {
    name: "",
    hero: "",
    side: "",
    category: "",
    archetype: "",
    description: "",
    image: "",
    creator: "",
    cost: "",
    cards: "",
    inspiration: "",
    optimization: "",
    suggested_date: "",
    updated_date: "",
    deck_doc: "",
  };

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

            <button
              type="button"
              className="admin-add-button"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Add Legacy Deck
            </button>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}

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

        {!error && (
          <p className="results-count">
            Showing {filteredDecks.length} of {decks.length} legacy decks
          </p>
        )}

        {!error && filteredDecks.length === 0 && (
          <p className="no-results">No legacy decks found.</p>
        )}

        {!error && filteredDecks.length > 0 && (
          <div className="deck-grid">
            {filteredDecks.map((deck) => {
              const id = deck.deckid ?? deck.deckID ?? deck.id;

              return (
                <div key={`${deck.side}-${id}-${deck.name}`}>
                  <DeckCard
                    decklist={deck}
                    admin
                    allCards={allCards}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    editSaving={editSaving}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer credits />

      {isAddModalOpen && (
        <DeckCard
          decklist={blankDeck}
          admin
          adminMode
          addMode
          allCards={allCards}
          onAdd={handleAdd}
          onClose={() => setIsAddModalOpen(false)}
          onComplete={() => setIsAddModalOpen(false)}
          editSaving={editSaving}
        />
      )}

      {deleteLoading && (
        <div className="admin-delete-overlay">
          <div className="admin-delete-dialog">Deleting legacy deck...</div>
        </div>
      )}
    </div>
  );
}

export default AdminLegacyDecks;