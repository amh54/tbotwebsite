import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";

import "../css/admin.css";
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
      "Slower than aggro, usually setting up early boards into mid-cost cards.",
  },
  control: {
    icon: "🛡️",
    description:
      "Focuses on removal and card advantage, winning in the late game.",
  },
  tempo: {
    icon: "🏃",
    description:
      "Focuses on building a strong board, winning trades and overwhelming the opponent.",
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

function AdminDecklists() {
  const normalizeFilterText = (value) => String(value || "").trim();

  const normalizeFilterKey = (value) =>
    normalizeFilterText(value).toLowerCase();

  const [decks, setDecks] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [cardsError, setCardsError] = useState("");

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");

  const [hero, setHero] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [category, setCategory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    document.title = "Admin - Decklists";

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
          `${API_BASE_URL}/tbotapp/admin/decklists/`,
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
              "Owner permissions are required to access the admin decklists.",
            );
          }

          throw new Error(message);
        }

        const data = await response.json();

        setDecks(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [],
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load admin decklists:", err);
          setError(err.message || "Unable to load decklists right now.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();

    return () => controller.abort();
  }, []);

  /*
   * ============================================================
   * CARD LIST (used for hero art/flavor lookups above, and passed
   * down to DeckCard to power the cards multi-select autocomplete)
   * ============================================================
   */

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      setCardsError("");

      try {
        const endpoint = `${API_BASE_URL}/tbotapp/cardinfo/`;

        const response = await fetch(endpoint, {
          method: "GET",
          signal: controller.signal,
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            `Card list request failed with status ${response.status}`,
          );

          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        if (!contentType.includes("application/json")) {
          const bodyPreview = (await response.text()).slice(0, 200);

          throw new Error(
            `Card list endpoint ${endpoint} returned non-JSON content (${
              contentType || "unknown content type"
            }). Response started with: ${bodyPreview}`,
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

    const selectedSide = side.toLowerCase();

    return decks.filter(
      (deck) => String(deck.side || "").toLowerCase() === selectedSide,
    );
  }, [decks, side]);

  const heroOptions = useMemo(() => {
    const heroMap = new Map();

    sideFilteredDecks.forEach((deck) => {
      const heroName = normalizeFilterText(deck.hero);

      if (!heroName) {
        return;
      }

      const key = normalizeFilterKey(heroName);

      if (!heroMap.has(key)) {
        heroMap.set(key, {
          value: heroName,
          label: heroName,
          count: 0,
          side: normalizeFilterKey(deck.side),
        });
      }

      heroMap.get(key).count += 1;
    });

    return [...heroMap.values()]
      .map((heroOption) => {
        const matchedCard = allCards.find(
          (card) =>
            normalizeFilterKey(card.card_name) ===
            normalizeFilterKey(heroOption.label),
        );

        return {
          ...heroOption,
          description: matchedCard?.flavor_text || "",
          image: matchedCard?.thumbnail || "",
        };
      })
      .sort((a, b) => {
        const sideOrder = {
          plants: 0,
          zombies: 1,
        };

        const sideCompare =
          (sideOrder[a.side] ?? 99) - (sideOrder[b.side] ?? 99);

        if (sideCompare !== 0) {
          return sideCompare;
        }

        return a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
        });
      });
  }, [sideFilteredDecks, allCards]);

  const categoryOptions = useMemo(() => {
    const grouped = sideFilteredDecks.reduce((acc, deck) => {
      const normalized = normalizeFilterText(deck.category);

      if (!normalized) {
        return acc;
      }

      const key = normalizeFilterKey(normalized);

      if (!acc[key]) {
        acc[key] = {
          value: normalized,
          label: normalized,
          count: 0,
          ...(CATEGORY_META[key] || {}),
        };
      }

      acc[key].count += 1;

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
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
      .filter((option) => option.count > 0);
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

  const filteredDecks = useMemo(() => {
    return sortedDecks.filter((deck) => {
      const searchValue = String(search || "")
        .trim()
        .toLowerCase();

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
        .map((value) => String(value).toLowerCase());

      const searchMatch =
        !searchValue ||
        searchableValues.some((value) => value.includes(searchValue));

      const sideValue = String(deck.side || "").toLowerCase();

      const sideMatch =
        side === "All" ||
        (side === "Plants" && sideValue === "plants") ||
        (side === "Zombies" && sideValue === "zombies");

      const heroMatch =
        hero.length === 0 ||
        hero.some(
          (selectedHero) =>
            normalizeFilterKey(deck.hero) ===
            normalizeFilterKey(selectedHero.value),
        );

      const deckArchetype = normalizeFilterKey(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          deckArchetype.includes(normalizeFilterKey(selectedArchetype.value)),
        );

      const categoryMatch =
        category.length === 0 ||
        category.some(
          (selectedCategory) =>
            normalizeFilterKey(deck.category) ===
            normalizeFilterKey(selectedCategory.value),
        );

      return (
        searchMatch && sideMatch && heroMatch && archetypeMatch && categoryMatch
      );
    });
  }, [sortedDecks, search, side, hero, archetype, category]);

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setArchetype([]);
    setCategory([]);
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  /* ============================================================
     EDIT / SAVE
     ============================================================ */

  const handleEdit = async (deck, form) => {
    if (!deck) {
      return null;
    }

    const deckId = deck.deckid ?? deck.deckID ?? deck.id;

    if (!deckId) {
      throw new Error("Unable to determine the deck ID.");
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

      /*
       * Only send image_file when the user selected a new image.
       *
       * If no new image was selected, DO NOT send image at all.
       * This lets Django preserve the existing image.
       */
      if (form?.image_file instanceof File) {
        formData.append("image_file", form.image_file);
      }

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/decklists/${encodeURIComponent(
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
        console.log("UPDATE STATUS:", response.status);
        console.log("UPDATE RESPONSE:", await response.clone().text());
        const message = await getApiErrorMessage(
          response,
          `Update failed with status ${response.status}`,
        );

        if (response.status === 403) {
          throw new Error("Owner permissions are required to edit decklists.");
        }

        throw new Error(message);
      }

      const updatedDeck = await response.json();

      console.log("UPDATED DECK FROM DJANGO:", updatedDeck);
      console.log("UPDATED IMAGE FROM DJANGO:", updatedDeck.image);

      /*
       * IMPORTANT:
       * Keep the image exactly as Django returned it.
       * DeckCard.getImageUrl() will turn /media/... into the
       * correct API URL when it renders.
       */
      const normalizedUpdatedDeck = {
        ...updatedDeck,
      };

      setDecks((currentDecks) =>
        currentDecks.map((currentDeck) => {
          const currentId =
            currentDeck.deckid ?? currentDeck.deckID ?? currentDeck.id;

          return String(currentId) === String(deckId)
            ? {
                ...currentDeck,
                ...normalizedUpdatedDeck,
              }
            : currentDeck;
        }),
      );

      setEditError("");

      /*
       * DeckCard expects onSave() to return the updated Django object.
       */
      return normalizedUpdatedDeck;
    } catch (err) {
      console.error("Unable to update deck:", err);

      setEditError(err.message || "Unable to update deck.");

      throw err;
    } finally {
      setEditSaving(false);
    }
  };

  /* ============================================================
     DELETE
     ============================================================ */

  const handleDelete = async (deck) => {
    const deckId = deck.deckid ?? deck.deckID ?? deck.id;

    if (!deckId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${deck.name || "this deck"}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/decklists/${encodeURIComponent(
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
            "Owner permissions are required to delete decklists.",
          );
        }

        throw new Error(message);
      }

      setDecks((currentDecks) =>
        currentDecks.filter(
          (currentDeck) =>
            String(
              currentDeck.deckid ?? currentDeck.deckID ?? currentDeck.id,
            ) !== String(deckId),
        ),
      );
    } catch (err) {
      console.error("Unable to delete deck:", err);

      setDeleteError(err.message || "Unable to delete deck.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const Sidebar = () => (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-title">TBOT</div>
        <div className="admin-subtitle">ADMIN</div>
      </div>

      <nav className="admin-sidebar-nav">
        <Link to="/admin">Dashboard</Link>

        <div className="admin-nav-section">
          <div className="admin-nav-heading">Decklists</div>

          <Link to="/admin/decklists" className="active">
            View all
          </Link>

          <Link to="/admin/decklists/add">Add deck</Link>
        </div>

        <div className="admin-nav-section">
          <div className="admin-nav-heading">Cards</div>

          <Link to="/admin/cards">View all</Link>
          <Link to="/admin/cards/add">Add card</Link>
        </div>

        <div className="admin-nav-section">
          <div className="admin-nav-heading">Heroes</div>

          <Link to="/admin/heroes">View all</Link>
          <Link to="/admin/heroes/add">Add hero</Link>
        </div>

        <div className="admin-nav-section">
          <div className="admin-nav-heading">Keep or Scrap</div>

          <Link to="/admin/keeporscrap">View all</Link>

          <Link to="/admin/keeporscrap/add">Add entry</Link>
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <Link to="/">← Back to Tbot</Link>
      </div>
    </aside>
  );

  if (loading) {
    return (
      <div className="admin-page">
        <Sidebar />

        <main className="admin-content admin-decklists-content">
          <div className="admin-content-header">
            <div>
              <h1>Decklists</h1>
              <p>Manage the decklists available on Tbot.</p>
            </div>
          </div>

          <div className="admin-loading">Loading decklists...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Sidebar />

      <main className="admin-content admin-decklists-content">
        <div className="admin-content-header admin-decklists-header">
          <div>
            <h1>Decklists</h1>

            <p>Manage the decklists available on Tbot.</p>
          </div>

          <Link to="/admin/decklists/add" className="admin-add-button">
            + Add Deck
          </Link>
        </div>

        {deleteError && <div className="admin-error">{deleteError}</div>}

        {editError && <div className="admin-error">{editError}</div>}

        {cardsError && (
          <div className="admin-error">Card list: {cardsError}</div>
        )}

        <div className="deck-browser admin-deck-browser">
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
          <p className="admin-results-count">
            Showing {filteredDecks.length} of {decks.length} decks
          </p>
        )}

        {error ? (
          <div className="admin-error">{error}</div>
        ) : filteredDecks.length === 0 ? (
          <div className="admin-no-results">No decklists found.</div>
        ) : (
          <div className="deck-grid admin-deck-grid">
            {filteredDecks.map((deck) => (
              <div
                key={`${deck.side}-${deck.deckid || deck.id || deck.name}`}
                className="admin-deck-wrapper"
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
        )}

        {deleteLoading && (
          <div className="admin-delete-overlay">
            <div className="admin-delete-dialog">Deleting deck...</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDecklists;
