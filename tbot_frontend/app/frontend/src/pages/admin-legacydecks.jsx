import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

const getCsrfToken = () => {
  const name = "csrftoken";

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());

  const csrfCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return csrfCookie
    ? decodeURIComponent(csrfCookie.substring(name.length + 1))
    : "";
};

const ensureCsrfToken = async () => {
  let csrfToken = getCookie("csrftoken") || getCsrfToken();

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

  csrfToken = getCookie("csrftoken") || getCsrfToken();

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Please refresh the page and try again.",
    );
  }

  return csrfToken;
};

/* ============================================================
   API ERROR HANDLING
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
   FILTER METADATA
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

/* ============================================================
   COMPONENT
   ============================================================ */

function AdminLegacyDecks() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAddPage = location.pathname === "/admin/legacy-decks/add";

  const [decks, setDecks] = useState([]);
  const [totalDecks, setTotalDecks] = useState(0);
  const [allCards, setAllCards] = useState([]);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);

  const [loading, setLoading] = useState(!isAddPage);
  const [error, setError] = useState("");
  const [cardsError, setCardsError] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  /* ============================================================
     PAGE TITLE
     ============================================================ */

  useEffect(() => {
    document.title = isAddPage
      ? "Admin - Add Legacy Deck"
      : "Admin - Legacy Decks";

    return () => {
      document.title = "Tbot";
    };
  }, [isAddPage]);

  /* ============================================================
     INITIALIZE CSRF
     ============================================================ */

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error("Unable to initialize CSRF:", err);
    });
  }, []);

  /* ============================================================
     FETCH CARDS
     ============================================================ */

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

  /* ============================================================
     FETCH LEGACY DECKS
     ============================================================ */

  useEffect(() => {
    if (isAddPage) {
      return;
    }

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
        setTotalDecks(results.length);
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
  }, [isAddPage]);

  /* ============================================================
     SIDE FILTER
     ============================================================ */

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    return decks.filter(
      (deck) => normalizeKey(deck.side) === normalizeKey(side),
    );
  }, [decks, side]);

  /* ============================================================
     HERO OPTIONS
     ============================================================ */

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
        });
      }

      heroMap.get(key).count += 1;
    });

    return Array.from(heroMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
  }, [sideFilteredDecks]);

  /* ============================================================
     CATEGORY OPTIONS
     ============================================================ */

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

  /* ============================================================
     ARCHETYPE OPTIONS
     ============================================================ */

  const archetypeOptions = useMemo(() => {
    const counts = {};

    Object.keys(ARCHETYPE_META).forEach((key) => {
      counts[key] = 0;
    });

    sideFilteredDecks.forEach((deck) => {
      const deckArchetype = normalizeKey(deck.archetype);

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

  /* ============================================================
     SORT
     ============================================================ */

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

  /* ============================================================
     FILTER
     ============================================================ */

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
        .map((value) => normalizeKey(value));

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

  /* ============================================================
     FILTER CONTROLS
     ============================================================ */

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

  /* ============================================================
     EDIT DECK
     ============================================================ */

  const handleEdit = async (deck, form) => {
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
          const currentId = item.deckid ?? item.deckID ?? item.id;

          return String(currentId) === String(deckId)
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

  /* ============================================================
     ADD DECK
     ============================================================ */

  const handleAdd = async (form) => {
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

      navigate("/admin/legacy-decks");

      return createdDeck;
    } catch (err) {
      setEditError(err.message || "Unable to add legacy deck.");

      throw err;
    } finally {
      setEditSaving(false);
    }
  };

  /* ============================================================
     DELETE DECK
     ============================================================ */

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
        throw new Error(
          await getApiErrorMessage(
            response,
            `Delete failed with status ${response.status}`,
          ),
        );
      }

      setDecks((current) =>
        current.filter((item) => {
          const currentId = item.deckid ?? item.deckID ?? item.id;

          return String(currentId) !== String(deckId);
        }),
      );

      setTotalDecks((current) => Math.max(0, current - 1));
    } catch (err) {
      setDeleteError(err.message || "Unable to delete legacy deck.");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ============================================================
     ADD PAGE
     ============================================================ */

  if (isAddPage) {
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
              <h1>Add Legacy Deck</h1>

              <p className="admin-decklists-subtitle">
                Create a new legacy decklist.
              </p>
            </div>

            <div className="admin-decklists-actions">
              <Link to="/admin/legacy-decks" className="admin-back-button">
                ← Legacy Decks
              </Link>
            </div>
          </div>

          {editError && <div className="admin-error">{editError}</div>}

          {cardsError && (
            <div className="admin-error">Card list: {cardsError}</div>
          )}

          <div className="deck-grid">
            <DeckCard
              decklist={blankDeck}
              admin
              adminMode
              addMode
              allCards={allCards}
              onAdd={handleAdd}
              editSaving={editSaving}
            />
          </div>
        </main>

        <Footer credits />

        {deleteLoading && (
          <div className="admin-delete-overlay">
            <div className="admin-delete-dialog">Deleting legacy deck...</div>
          </div>
        )}
      </div>
    );
  }

  /* ============================================================
     LOADING
     ============================================================ */

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
              {totalDecks > 0 ? `${totalDecks} decks` : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN PAGE
     ============================================================ */

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

            <Link to="/admin/legacy-decks/add" className="admin-add-button">
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
            Showing {filteredDecks.length} of {totalDecks || decks.length}{" "}
            legacy decks
          </p>
        )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No legacy decks found.</p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map((deck) => (
                <div
                  key={`${deck.side}-${deck.deckid || deck.deckID || deck.id}-${deck.name}`}
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

      {deleteLoading && (
        <div className="admin-delete-overlay">
          <div className="admin-delete-dialog">Deleting legacy deck...</div>
        </div>
      )}
    </div>
  );
}

export default AdminLegacyDecks;
