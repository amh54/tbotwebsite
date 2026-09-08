import { useEffect, useMemo, useState } from "react";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import Footer from "../components/footer";

import "../css/decklists.css";
import "../css/loading.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(
    import.meta.env.VITE_API_BASE_URL || "",
  ).trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const ADMIN_USER_DECKS_ENDPOINT =
  `${API_BASE_URL}/tbotapp/admin/user-decks/`;

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

  const response = await fetch(
    `${API_BASE_URL}/tbotapp/csrf/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to initialize CSRF protection. Please refresh the page.",
    );
  }

  const data = await response.json();

  csrfToken =
    data?.csrfToken ||
    data?.csrf_token ||
    data?.token ||
    getCookie("csrftoken");

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
    // Response was not JSON.
  }

  return message;
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

function parseDeckCards(value) {
  return String(value ?? "")
    .replace(/\\\r\n/g, "\n")
    .replace(/\\\n/g, "\n")
    .replace(/\\\r/g, "\r")
    .split(/\r?\n|,/)
    .map((card) => card.trim())
    .filter(Boolean);
}

function getDeckId(deck) {
  return (
    deck?.id ??
    deck?.deckid ??
    deck?.deckID ??
    deck?.deck_id ??
    null
  );
}

function getProfileName(deck) {
  return (
    normalizeText(deck?.profile_display_name) ||
    normalizeText(deck?.display_name) ||
    normalizeText(deck?.username) ||
    normalizeText(deck?.profile_slug) ||
    normalizeText(deck?.user) ||
    normalizeText(deck?.owner) ||
    ""
  );
}

function getDeckOwner(deck) {
  return (
    getProfileName(deck) ||
    normalizeText(deck?.creator) ||
    "Unknown User"
  );
}

function AdminUserDecks() {
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
    document.title = "Admin - User Decks";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  /*
   * ============================================================
   * INITIALIZE CSRF
   * ============================================================
   */

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error(
        "Unable to initialize CSRF:",
        err,
      );
    });
  }, []);

  /*
   * ============================================================
   * LOAD USER DECKS
   * ============================================================
   */

  useEffect(() => {
    const controller = new AbortController();

    const fetchUserDecks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          ADMIN_USER_DECKS_ENDPOINT,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const message =
            await getApiErrorMessage(
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
              "Owner permissions are required to access user decks.",
            );
          }

          throw new Error(message);
        }

        const data = await response.json();

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.decks)
            ? data.decks
            : Array.isArray(data?.results)
              ? data.results
              : [];

        setDecks(results);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error(
          "Unable to load admin user decks:",
          err,
        );

        setError(
          err.message ||
            "Unable to load user decks right now.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUserDecks();

    return () => controller.abort();
  }, []);

  /*
   * ============================================================
   * LOAD CARDS
   * ============================================================
   */

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        setCardsError("");

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/cardinfo/`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

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
        if (err.name === "AbortError") {
          return;
        }

        console.error(
          "Unable to load card information:",
          err,
        );

        setCardsError(
          err.message ||
            "Unable to load card information right now.",
        );
      }
    };

    fetchCards();

    return () => controller.abort();
  }, []);

  /*
   * ============================================================
   * SIDE FILTER
   * ============================================================
   */

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeKey(side);

    return decks.filter(
      (deck) =>
        normalizeKey(deck.side) === selectedSide,
    );
  }, [decks, side]);

  /*
   * ============================================================
   * HERO OPTIONS
   * ============================================================
   */

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
            normalizeKey(card.card_name) ===
            normalizeKey(option.label),
        );

        return {
          ...option,
          description:
            matchedCard?.flavor_text || "",
          image:
            matchedCard?.thumbnail || "",
        };
      })
      .sort((a, b) =>
        a.label.localeCompare(
          b.label,
          undefined,
          {
            sensitivity: "base",
          },
        ),
      );
  }, [sideFilteredDecks, allCards]);

  /*
   * ============================================================
   * CATEGORY OPTIONS
   * ============================================================
   */

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();

    sideFilteredDecks.forEach((deck) => {
      const categoryName = normalizeText(
        deck.category,
      );

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

    return Array.from(categoryMap.values()).sort(
      (a, b) =>
        a.label.localeCompare(
          b.label,
          undefined,
          {
            sensitivity: "base",
          },
        ),
    );
  }, [sideFilteredDecks]);

  /*
   * ============================================================
   * ARCHETYPE OPTIONS
   * ============================================================
   */

  const archetypeOptions = useMemo(() => {
    const counts = {};

    Object.keys(ARCHETYPE_META).forEach(
      (key) => {
        counts[key] = 0;
      },
    );

    sideFilteredDecks.forEach((deck) => {
      const deckArchetype = normalizeKey(
        deck.archetype,
      );

      if (!deckArchetype) {
        return;
      }

      Object.keys(ARCHETYPE_META).forEach(
        (archetypeName) => {
          if (
            deckArchetype.includes(
              archetypeName,
            )
          ) {
            counts[archetypeName] += 1;
          }
        },
      );
    });

    return Object.entries(ARCHETYPE_META)
      .map(([value, meta]) => ({
        value,
        label:
          value.charAt(0).toUpperCase() +
          value.slice(1),
        count: counts[value] || 0,
        ...meta,
      }))
      .filter(
        (option) => option.count > 0,
      );
  }, [sideFilteredDecks]);

  /*
   * ============================================================
   * FILTERING
   * ============================================================
   */

  const filteredDecks = useMemo(() => {
    const searchValue = normalizeKey(search);

    const alias = HERO_ALIAS[searchValue]
      ? normalizeKey(HERO_ALIAS[searchValue])
      : "";

    return sideFilteredDecks.filter(
      (deck) => {
        const deckCards = parseDeckCards(
          deck.cards,
        );

        const searchableCardValues =
          deckCards.map(normalizeKey);

        const searchableValues = [
          deck.name,
          deck.creator,
          deck.optimization,
          deck.hero,
          deck.archetype,
          deck.category,
          getDeckOwner(deck),
          deck.profile_slug,
          deck.profile_display_name,
          deck.display_name,
          deck.username,
        ]
          .filter(Boolean)
          .map(normalizeKey);

        let searchMatch = true;

        if (searchValue) {
          if (alias) {
            searchMatch =
              normalizeKey(
                deck.hero,
              ).includes(alias);
          } else {
            const normalFieldMatch =
              searchableValues.some(
                (value) =>
                  value.includes(
                    searchValue,
                  ),
              );

            const cardMatch =
              searchableCardValues.some(
                (card) =>
                  card.includes(
                    searchValue,
                  ),
              );

            searchMatch =
              normalFieldMatch ||
              cardMatch;
          }
        }

        const deckSide =
          normalizeKey(deck.side);

        const sideMatch =
          side === "All" ||
          deckSide === normalizeKey(side);

        const heroMatch =
          hero.length === 0 ||
          hero.some(
            (selectedHero) =>
              normalizeKey(
                deck.hero,
              ) ===
              normalizeKey(
                selectedHero.value,
              ),
          );

        const categoryMatch =
          category.length === 0 ||
          category.some(
            (selectedCategory) =>
              normalizeKey(
                deck.category,
              ) ===
              normalizeKey(
                selectedCategory.value,
              ),
          );

        const deckArchetype =
          normalizeKey(
            deck.archetype,
          );

        const archetypeMatch =
          archetype.length === 0 ||
          archetype.every(
            (selectedArchetype) =>
              deckArchetype.includes(
                normalizeKey(
                  selectedArchetype.value,
                ),
              ),
          );

        return (
          searchMatch &&
          sideMatch &&
          heroMatch &&
          categoryMatch &&
          archetypeMatch
        );
      },
    );
  }, [
    sideFilteredDecks,
    search,
    side,
    hero,
    category,
    archetype,
  ]);

  /*
   * ============================================================
   * CLEAR FILTERS
   * ============================================================
   */

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

  /*
   * ============================================================
   * EDIT USER DECK
   *
   * Called by DeckCard / the admin deck modal.
   *
   * PATCH:
   * /tbotapp/admin/user-decks/<id>/
   * ============================================================
   */

  const handleEdit = async (deck, form) => {
    const deckId =
      deck?.id ??
      deck?.deckid ??
      deck?.deckID ??
      deck?.deck_id;

    if (
      deckId === null ||
      deckId === undefined ||
      deckId === ""
    ) {
      throw new Error(
        "User deck ID is missing.",
      );
    }

    setEditError("");
    setEditSaving(true);

    try {
      const csrfToken =
        await ensureCsrfToken();

      const url =
        `${API_BASE_URL}/tbotapp/admin/user-decks/` +
        `${encodeURIComponent(deckId)}/`;

      const hasImageFile =
        form?.image_file instanceof File;

      let response;

      if (hasImageFile) {
        const formData = new FormData();

        formData.append(
          "name",
          form?.name ?? "",
        );

        formData.append(
          "hero",
          form?.hero ?? "",
        );

        formData.append(
          "side",
          form?.side ?? "",
        );

        formData.append(
          "category",
          form?.category ?? "",
        );

        formData.append(
          "archetype",
          form?.archetype ?? "",
        );

        formData.append(
          "description",
          form?.description ?? "",
        );

        formData.append(
          "creator",
          form?.creator ?? "",
        );

        formData.append(
          "cost",
          form?.cost ?? "",
        );

        formData.append(
          "inspiration",
          form?.inspiration ?? "",
        );

        formData.append(
          "optimization",
          form?.optimization ?? "",
        );

        formData.append(
          "suggested_date",
          form?.suggested_date ?? "",
        );

        formData.append(
          "updated_date",
          form?.updated_date ?? "",
        );

        formData.append(
          "deck_doc",
          form?.deck_doc ?? "",
        );

        formData.append(
          "cards",
          form?.cards ?? "",
        );

        formData.append(
          "image_file",
          form.image_file,
        );

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
        response = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            name: form?.name ?? "",
            hero: form?.hero ?? "",
            side: form?.side ?? "",
            category:
              form?.category ?? "",
            archetype:
              form?.archetype ?? "",
            description:
              form?.description ?? "",
            image:
              form?.image ?? "",
            creator:
              form?.creator ?? "",
            cost:
              form?.cost ?? "",
            inspiration:
              form?.inspiration ?? "",
            optimization:
              form?.optimization ?? "",
            suggested_date:
              form?.suggested_date ?? "",
            updated_date:
              form?.updated_date ?? "",
            deck_doc:
              form?.deck_doc ?? "",
            cards:
              form?.cards ?? "",
          }),
        });
      }

      const responseText =
        await response.text();

      let data = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.error ||
          `Failed to save user deck (${response.status}).`;

        throw new Error(message);
      }

      const updatedDeck =
        data?.deck ??
        data?.result ??
        data;

      setDecks(
        (previousDecks) =>
          previousDecks.map(
            (existingDeck) => {
              const existingId =
                getDeckId(existingDeck);

              if (
                String(existingId) !==
                String(deckId)
              ) {
                return existingDeck;
              }

              return {
                ...existingDeck,
                ...(updatedDeck || {}),
              };
            },
          ),
      );

      return updatedDeck;
    } catch (error) {
      console.error(
        "User deck update failed:",
        error,
      );

      setEditError(
        error?.message ||
          "Failed to save user deck.",
      );

      throw error;
    } finally {
      setEditSaving(false);
    }
  };

  /*
   * ============================================================
   * DELETE USER DECK
   *
   * Called by DeckCard / the admin deck modal.
   *
   * DELETE:
   * /tbotapp/admin/user-decks/<id>/delete/
   * ============================================================
   */

  const handleDelete = async (deck) => {
    const deckId = getDeckId(deck);

    if (
      deckId === null ||
      deckId === undefined ||
      deckId === ""
    ) {
      setDeleteError(
        "User deck ID is missing.",
      );
      throw new Error(
        "User deck ID is missing.",
      );
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        deck?.name || "this deck"
      }"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return false;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const csrfToken =
        await ensureCsrfToken();

      const deleteUrl =
        `${API_BASE_URL}/tbotapp/admin/user-decks/` +
        `${encodeURIComponent(deckId)}/delete/`;

      const response = await fetch(
        deleteUrl,
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
        const message =
          await getApiErrorMessage(
            response,
            `Delete failed with status ${response.status}`,
          );

        if (response.status === 403) {
          throw new Error(
            "Owner permissions are required to delete user decks.",
          );
        }

        throw new Error(message);
      }

      setDecks(
        (currentDecks) =>
          currentDecks.filter(
            (currentDeck) =>
              String(
                getDeckId(currentDeck),
              ) !== String(deckId),
          ),
      );

      return true;
    } catch (err) {
      console.error(
        "Unable to delete user deck:",
        err,
      );

      setDeleteError(
        err.message ||
          "Unable to delete user deck.",
      );

      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading user decks</h2>

          <p>
            Preparing the admin deck
            browser and loading all user
            decks.
          </p>

          <div className="loading-status">
            <span>
              Loading user deck data
            </span>

            <strong>
              Loading...
            </strong>
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
            <h1>User Decks</h1>

            <p className="admin-decklists-subtitle">
              Manage decks created by
              users on Tbot.
            </p>
          </div>

          <div className="admin-decklists-actions">
            <button
              type="button"
              className="admin-back-button"
              onClick={() => {
                window.location.href =
                  "/admin";
              }}
            >
              ← Admin
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="admin-error">
            {deleteError}
          </div>
        )}

        {editError && (
          <div className="admin-error">
            {editError}
          </div>
        )}

        {cardsError && (
          <div className="admin-error">
            Card list: {cardsError}
          </div>
        )}

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <div className="deck-browser">
          <div className="tabs">
            <button
              type="button"
              className={
                side === "All"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleSideChange("All")
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                side === "Plants"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleSideChange(
                  "Plants",
                )
              }
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
              className={
                side === "Zombies"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleSideChange(
                  "Zombies",
                )
              }
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
              placeholder="Search decks, users, heroes, cards..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
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
                options={
                  categoryOptions
                }
                value={category}
                onChange={
                  setCategory
                }
                multi
              />
            </div>

            <div className="select-wrapper archetype-select-wrapper">
              <FilterDropdown
                label="Archetype"
                options={
                  archetypeOptions
                }
                value={archetype}
                onChange={
                  setArchetype
                }
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
            Showing{" "}
            {filteredDecks.length}{" "}
            of {decks.length} user
            decks
          </p>
        )}

        {!error &&
        filteredDecks.length ===
          0 ? (
          <p className="no-results">
            No user decks found.
          </p>
        ) : (
          !error && (
            <div className="deck-grid">
              {filteredDecks.map(
                (deck) => {
                  const deckId =
                    getDeckId(deck);

                  return (
                    <div
                      key={`user-${String(
                        deckId ??
                          `${deck.name}-${getDeckOwner(deck)}`,
                      )}`}
                    >
                      <DeckCard
                        decklist={deck}
                        admin
                        allCards={allCards}
                        onSave={
                          handleEdit
                        }
                        onDelete={
                          handleDelete
                        }
                        editSaving={
                          editSaving
                        }
                      />
                    </div>
                  );
                },
              )}
            </div>
          )
        )}
      </main>

      <Footer credits />

      {deleteLoading && (
        <div className="admin-delete-overlay">
          <div className="admin-delete-dialog">
            Deleting user deck...
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserDecks;