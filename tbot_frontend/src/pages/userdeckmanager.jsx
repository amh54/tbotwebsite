import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import DeckCard from "../components/modals/deckcomponent.jsx";

import FilterDropdown from "../components/filterdropdown";

import Footer from "../components/footer";

import "../css/decklists.css";

import "../css/loading.css";

import "../css/userdecklists.css";

import {
  API_BASE_URL,
  ensureCsrfToken,
  getApiErrorMessage,
} from "../utils/api.js";

import {
  normalizeText,
  sortDecks,
  getFilterOptions,
  filterDecks,
} from "../utils/deckFilters";

function UserDeckManager() {
  const navigate = useNavigate();

  const [decks, setDecks] = useState([]);
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [cardsError, setCardsError] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addingDeck, setAddingDeck] = useState(false);

  useEffect(() => {
    document.title = "My Decklists";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const checkAuthentication = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/auth/discord/me/`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          navigate("/");
          return;
        }

        const data = await response.json();

        if (!data.authenticated) {
          navigate("/");
          return;
        }

        setAuthenticated(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to verify authentication:", err);
          navigate("/");
        }
      }
    };

    checkAuthentication();

    return () => controller.abort();
  }, [navigate]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        setCardsError("");

        const response = await fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
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
  }, [authenticated]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/tbotapp/user-decks/`, {
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
      console.error("Unable to load user decklists:", err);

      setError(
        `Unable to load your decklists right now. ${err.message || ""}`.trim(),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    loadDecks();
  }, [authenticated]);

  const sortedDecks = useMemo(() => sortDecks(decks), [decks]);

  const { heroOptions, categoryOptions, archetypeOptions } = useMemo(
    () =>
      getFilterOptions({
        decks: sortedDecks,
        allCards,
        search,
        side,
        hero,
        category,
        archetype,
        collection: null,
        collectionMap: null,
        collectionLoading: false,
        collectionLoaded: false,
        discordUser: null,
        authLoading: false,
      }),
    [sortedDecks, allCards, search, side, hero, category, archetype],
  );

  const filteredDecks = useMemo(
    () =>
      filterDecks({
        decks: sortedDecks,
        search,
        side,
        hero,
        category,
        archetype,
        collection: null,
        collectionMap: null,
        collectionLoading: false,
        collectionLoaded: false,
        discordUser: null,
      }),
    [sortedDecks, search, side, hero, category, archetype],
  );

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

  const handleAdd = async (form) => {
    setError("");

    try {
      const csrfToken = await ensureCsrfToken();

      const createUrl = `${API_BASE_URL}/tbotapp/user-decks/create/`;

      const creator = normalizeText(form?.creator);

      if (!creator) {
        throw new Error("Creator is required.");
      }

      const hasImageFile = form?.image_file instanceof File;

      let response;

      if (hasImageFile) {
        const formData = new FormData();

        formData.append("name", form.name ?? "");
        formData.append("hero", form.hero ?? "");
        formData.append("side", form.side ?? "");
        formData.append("category", form.category ?? "");
        formData.append("archetype", form.archetype ?? "");
        formData.append("description", form.description ?? "");
        formData.append("creator", creator);
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
            creator,
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
        await loadDecks();
      }

      setAddingDeck(false);

      return newDeck;
    } catch (error) {
      console.error("Unable to add deck:", error);

      setError(error.message || "Unable to add deck.");

      throw error;
    }
  };

  const handleSave = async (deck, form) => {
    const deckId = deck?.deckid ?? deck?.deckID ?? deck?.id;

    if (!deckId) {
      throw new Error("Deck ID is missing.");
    }

    setEditError("");
    setEditSaving(true);

    try {
      const csrfToken = await ensureCsrfToken();

      const url =
        `${API_BASE_URL}/tbotapp/user-decks/` +
        `${encodeURIComponent(deckId)}/`;

      const hasImageFile = form?.image_file instanceof File;

      let response;

      if (hasImageFile) {
        const formData = new FormData();

        formData.append("name", form.name ?? "");
        formData.append("hero", form.hero ?? "");
        formData.append("side", form.side ?? "");
        formData.append("category", form.category ?? "");
        formData.append("archetype", form.archetype ?? "");
        formData.append("description", form.description ?? "");
        formData.append("creator", normalizeText(form.creator));
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
            image: form.image ?? deck.image ?? "",
            creator: normalizeText(form.creator),
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

      if (!updatedDeck) {
        await loadDecks();
        return null;
      }

      setDecks((currentDecks) =>
        currentDecks.map((existingDeck) => {
          const existingId =
            existingDeck.deckid ?? existingDeck.deckID ?? existingDeck.id;

          if (String(existingId) !== String(deckId)) {
            return existingDeck;
          }

          return {
            ...existingDeck,
            ...updatedDeck,
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
        `${API_BASE_URL}/tbotapp/user-decks/` +
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

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />
          <h2>Loading your decklists</h2>
          <p>Preparing your personal deck browser.</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="deck-page">
      <main className="deck-content">
        <div className="admin-decklists-topbar">
          <div>
            <h1>My Decklists</h1>
            <p className="admin-decklists-subtitle">
              Manage and upload your personal Tbot decks. Please share the decks
              uploaded from your profile page
            </p>
          </div>

          <div className="admin-decklists-actions">
            <Link to="/dashboard" className="admin-back-button">
              ← Dashboard
            </Link>

            <button
              type="button"
              className="admin-add-button"
              onClick={() => {
                setEditError("");
                setDeleteError("");
                setError("");
                setAddingDeck(true);
              }}
            >
              + Add Deck
            </button>
          </div>
        </div>

        {deleteError && <div className="admin-error">{deleteError}</div>}

        {editError && <div className="admin-error">{editError}</div>}

        {cardsError && (
          <div className="admin-error">Card list: {cardsError}</div>
        )}

        {error && <div className="admin-error">{error}</div>}

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
              placeholder="Search your decks, heroes, cards..."
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

        <div className="user-decklists-results-bar">
          <p className="results-count">
            Showing {filteredDecks.length} of {decks.length} decks
          </p>
        </div>

        {filteredDecks.length === 0 ? (
          <div className="user-decklists-empty">
            <h2>No decks found</h2>

            <p>You haven't created a deck matching these filters.</p>

            <button
              type="button"
              className="admin-add-button"
              onClick={() => {
                setEditError("");
                setDeleteError("");
                setError("");
                setAddingDeck(true);
              }}
            >
              + Add Deck
            </button>
          </div>
        ) : (
          <div className="deck-grid">
            {filteredDecks.map((deck) => (
              <div
                key={`${deck.side}-${
                  deck.deckid || deck.deckID || deck.id || deck.name
                }`}
              >
                <DeckCard
                  decklist={deck}
                  admin
                  allCards={allCards}
                  onDelete={handleDelete}
                  onSave={handleSave}
                  editSaving={editSaving}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer credits="Manage and upload your personal Tbot decklists. Share your decks with the PVZH community from your profile page." />

      {deleteLoading && (
        <div className="admin-delete-overlay">
          <div className="admin-delete-dialog">Deleting deck...</div>
        </div>
      )}
    </div>
  );
}

export default UserDeckManager;
