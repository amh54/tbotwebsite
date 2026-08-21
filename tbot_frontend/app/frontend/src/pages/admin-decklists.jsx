import { useEffect, useMemo, useState } from "react";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import Footer from "../components/footer";

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

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

/* ============================================================
   CSRF
   ============================================================ */

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
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      "Unable to initialize CSRF protection. Please refresh the page.",
    );
  }

  const data = await response.json();

  csrfToken = data?.csrfToken || data?.csrf_token || getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Please refresh the page and try again.",
    );
  }

  return csrfToken;
};

/* ============================================================
   API ERROR
   ============================================================ */

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
    return message;
  }

  return message;
};

/* ============================================================
   ARCHETYPE META
   ============================================================ */

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

/* ============================================================
   COMPONENT
   ============================================================ */

function AdminDecklists() {
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

  const [addingDeck, setAddingDeck] = useState(false);

  /* ==========================================================
     TITLE
     ========================================================== */

  useEffect(() => {
    document.title = "Admin - Decklists";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  /* ==========================================================
     INITIALIZE CSRF
     ========================================================== */

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error("Unable to initialize CSRF:", err);
    });
  }, []);

  /* ==========================================================
     FETCH DECKS
     GET /admin/decklists/
     ========================================================== */

  const fetchDecks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/tbotapp/admin/decklists/`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

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

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setDecks(results);
    } catch (err) {
      console.error("Unable to load admin decklists:", err);

      setError(err.message || "Unable to load decklists right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  /* ==========================================================
     FETCH CARDS
     ========================================================== */

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

  /* ==========================================================
     SIDE FILTER
     ========================================================== */

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeKey(side);

    return decks.filter((deck) => normalizeKey(deck.side) === selectedSide);
  }, [decks, side]);

  /* ==========================================================
     HERO OPTIONS
     ========================================================== */

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

  /* ==========================================================
     FILTER
     ========================================================== */

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

      const deckSide = normalizeKey(deck.side);

      const sideMatch = side === "All" || deckSide === normalizeKey(side);

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

  /* ==========================================================
     FILTER CONTROLS
     ========================================================== */

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

  /* ==========================================================
     EDIT DECK
     PATCH /admin/decklists/<id>/
     ========================================================== */

  const handleEdit = async (deck, form) => {
    const deckId = deck?.deckid ?? deck?.deckID ?? deck?.id;

    if (!deckId) {
      throw new Error("Deck ID is missing.");
    }

    setEditError("");
    setEditSaving(true);

    try {
      const csrfToken = await ensureCsrfToken();

      const url =
        `${API_BASE_URL}/tbotapp/admin/decklists/` +
        `${encodeURIComponent(deckId)}/`;

      const hasImageFile = form?.image_file instanceof File;

      let response;

      /* --------------------------------------------------------
         IMAGE UPLOAD
         -------------------------------------------------------- */

      if (hasImageFile) {
        const formData = new FormData();

        formData.append("name", form.name ?? "");

        formData.append("hero", form.hero ?? "");

        formData.append("side", form.side ?? "");

        formData.append("category", form.category ?? "");

        formData.append("archetype", form.archetype ?? "");

        formData.append("description", form.description ?? "");

        formData.append("creator", form.creator ?? "");

        formData.append("cost", form.cost ?? "");

        formData.append("inspiration", form.inspiration ?? "");

        formData.append("optimization", form.optimization ?? "");

        formData.append("suggested_date", form.suggested_date ?? "");

        formData.append("updated_date", form.updated_date ?? "");

        formData.append("deck_doc", form.deck_doc ?? "");

        formData.append("cards", form.cards ?? "");

        formData.append("image_file", form.image_file);

        response = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: formData,
        });
      } else {
        /* ------------------------------------------------------
           JSON UPDATE
           ------------------------------------------------------ */

        response = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            name: form.name ?? "",
            hero: form.hero ?? "",
            side: form.side ?? "",
            category: form.category ?? "",
            archetype: form.archetype ?? "",
            description: form.description ?? "",
            image: form.image ?? "",
            creator: form.creator ?? "",
            cost: form.cost ?? "",
            inspiration: form.inspiration ?? "",
            optimization: form.optimization ?? "",
            suggested_date: form.suggested_date ?? "",
            updated_date: form.updated_date ?? "",
            deck_doc: form.deck_doc ?? "",
            cards: form.cards ?? "",
          }),
        });
      }

      const responseText = await response.text();

      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.error ||
          `Failed to save deck (${response.status}).`;

        throw new Error(message);
      }

      const updatedDeck = data?.deck ?? data?.result ?? data;

      setDecks((previousDecks) =>
        previousDecks.map((existingDeck) => {
          const existingId =
            existingDeck.deckid ?? existingDeck.deckID ?? existingDeck.id;

          if (String(existingId) !== String(deckId)) {
            return existingDeck;
          }

          return {
            ...existingDeck,
            ...(updatedDeck || {}),
          };
        }),
      );

      return updatedDeck;
    } catch (error) {
      console.error("Deck update failed:", error);

      setEditError(error?.message || "Failed to save deck.");

      throw error;
    } finally {
      setEditSaving(false);
    }
  };


  const handleAdd = async (form) => {
    setError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const hasImageFile = form?.image_file instanceof File;

      const createUrl = `${API_BASE_URL}/tbotapp/admin/decklists/create/`;

      let response;

      /* --------------------------------------------------------
         IMAGE UPLOAD
         -------------------------------------------------------- */

      if (hasImageFile) {
        const formData = new FormData();

        formData.append("name", form.name ?? "");

        formData.append("hero", form.hero ?? "");

        formData.append("side", form.side ?? "");

        formData.append("category", form.category ?? "");

        formData.append("archetype", form.archetype ?? "");

        formData.append("description", form.description ?? "");

        formData.append("creator", form.creator ?? "");

        formData.append("cost", form.cost ?? "");

        formData.append("inspiration", form.inspiration ?? "");

        formData.append("optimization", form.optimization ?? "");

        formData.append("suggested_date", form.suggested_date ?? "");

        formData.append("updated_date", form.updated_date ?? "");

        formData.append("deck_doc", form.deck_doc ?? "");

        formData.append("cards", form.cards ?? "");

        formData.append("image_file", form.image_file);

        response = await fetch(createUrl, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: formData,
        });
      } else {
        /* ------------------------------------------------------
           JSON CREATE
           ------------------------------------------------------ */

        response = await fetch(createUrl, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            name: form.name ?? "",
            hero: form.hero ?? "",
            side: form.side ?? "",
            category: form.category ?? "",
            archetype: form.archetype ?? "",
            description: form.description ?? "",
            image: form.image ?? "",
            creator: form.creator ?? "",
            cost: form.cost ?? "",
            inspiration: form.inspiration ?? "",
            optimization: form.optimization ?? "",
            suggested_date: form.suggested_date ?? "",
            updated_date: form.updated_date ?? "",
            deck_doc: form.deck_doc ?? "",
            cards: form.cards ?? "",
          }),
        });
      }

      const responseText = await response.text();

      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.error ||
          `Failed to add deck (${response.status}).`;

        throw new Error(message);
      }

      const newDeck = data?.deck ?? data?.result ?? data;

      if (newDeck) {
        setDecks((currentDecks) => [...currentDecks, newDeck]);
      } else {
        await fetchDecks();
      }

      setAddingDeck(false);

      return newDeck;
    } catch (error) {
      console.error("Unable to add deck:", error);

      throw error;
    }
  };

  /* ==========================================================
     DELETE DECK
     DELETE /admin/decklists/<id>/delete/
     ========================================================== */

  const handleDelete = async (deck) => {
    const deckId = deck?.deckid ?? deck?.deckID ?? deck?.id;

    if (!deckId) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        deck.name || "this deck"
      }"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const deleteUrl =
        `${API_BASE_URL}/tbotapp/admin/decklists/` +
        `${encodeURIComponent(deckId)}/delete/`;

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-CSRFToken": csrfToken,
        },
      });

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
        currentDecks.filter((currentDeck) => {
          const currentId =
            currentDeck.deckid ?? currentDeck.deckID ?? currentDeck.id;

          return String(currentId) !== String(deckId);
        }),
      );
    } catch (err) {
      console.error("Unable to delete deck:", err);

      setDeleteError(err.message || "Unable to delete deck.");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading decklists</h2>

          <p>Preparing the deck browser and loading available decks.</p>

          <div className="loading-status">
            <span>Loading deck data</span>

            <strong>Loading...</strong>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="deck-page">
      <main className="deck-content">
        {/* ======================================================
            TOP BAR
            ====================================================== */}

        <div className="admin-decklists-topbar">
          <div>
            <h1>Decklists</h1>

            <p className="admin-decklists-subtitle">
              Manage the decklists available on Tbot.
            </p>
          </div>

          <div className="admin-decklists-actions">
            <button
              type="button"
              className="admin-back-button"
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              ← Admin
            </button>

            <button
              type="button"
              className="admin-add-button"
              onClick={() => {
                setEditError("");
                setDeleteError("");
                setAddingDeck(true);
              }}
            >
              + Add Deck
            </button>
          </div>
        </div>

        {/* ======================================================
            ERRORS
            ====================================================== */}

        {deleteError && <div className="admin-error">{deleteError}</div>}

        {editError && <div className="admin-error">{editError}</div>}

        {cardsError && (
          <div className="admin-error">Card list: {cardsError}</div>
        )}

        {error && <div className="admin-error">{error}</div>}

        {/* ======================================================
            ADD DECK
            ====================================================== */}

        {addingDeck && (
          <DeckCard
            addMode
            admin
            allCards={allCards}
            onAdd={handleAdd}
            onComplete={() => {
              setAddingDeck(false);
            }}
          />
        )}

        {/* ======================================================
            BROWSER
            ====================================================== */}

        <div className="deck-browser">
          {/* ====================================================
              SIDE TABS
              ==================================================== */}

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

          {/* ====================================================
              SEARCH
              ==================================================== */}

          <div className="search-container">
            <input
              className="search"
              placeholder="Search decks, creators, heroes, cards..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {/* ====================================================
              FILTERS
              ==================================================== */}

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

        {/* ======================================================
            RESULTS COUNT
            ====================================================== */}

        {!error && (
          <p className="results-count">
            Showing {filteredDecks.length} of {decks.length} decks
          </p>
        )}

        {/* ======================================================
            RESULTS
            ====================================================== */}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No decklists found.</p>
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

      <Footer credits />

      {/* ========================================================
          DELETE OVERLAY
          ======================================================== */}

      {deleteLoading && (
        <div className="admin-delete-overlay">
          <div className="admin-delete-dialog">Deleting deck...</div>
        </div>
      )}
    </div>
  );
}

export default AdminDecklists;
