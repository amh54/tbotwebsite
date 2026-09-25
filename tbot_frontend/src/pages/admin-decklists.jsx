import { useEffect, useMemo, useState } from "react";

import DeckCard from "../components/modals/deckcomponent.jsx";
import FilterDropdown from "../components/filterdropdown";
import Footer from "../components/footer";

import {
  API_BASE_URL,
  ensureCsrfToken,
  getApiErrorMessage,
} from "../utils/api.js";

import {
  getHeroOptions,
  getCategoryOptions,
  getArchetypeOptions,
  normalizeSide,
  sortDecks,
  filterDecks,
} from "../utils/deckFilters.js";

import "../css/decklists.css";
import "../css/loading.css";

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

  useEffect(() => {
    document.title = "Admin - Decklists";

    return () => {
      document.title = "Tbot";
    };
  }, []);

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
      console.error("Unable to load admin decklists:", err);
      setError(err.message || "Unable to load decklists right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
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
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load card information:", err);

        setCardsError(
          err.message || "Unable to load card information right now.",
        );
      }
    };

    fetchCards();

    return () => {
      controller.abort();
    };
  }, []);

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeSide(side);

    return decks.filter((deck) => normalizeSide(deck?.side) === selectedSide);
  }, [decks, side]);

  const heroOptions = useMemo(
    () => getHeroOptions(sideFilteredDecks, allCards),
    [sideFilteredDecks, allCards],
  );

  const categoryOptions = useMemo(
    () => getCategoryOptions(sideFilteredDecks),
    [sideFilteredDecks],
  );

  const archetypeOptions = useMemo(
    () => getArchetypeOptions(sideFilteredDecks),
    [sideFilteredDecks],
  );

  const sortedDecks = useMemo(() => sortDecks(decks), [decks]);

  const filteredDecks = useMemo(
    () =>
      filterDecks({
        decks: sortedDecks,
        search,
        side,
        hero,
        category,
        archetype,
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
        throw new Error(
          data?.detail ||
            data?.error ||
            `Failed to save deck (${response.status}).`,
        );
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
    } catch (err) {
      console.error("Deck update failed:", err);

      setEditError(err?.message || "Failed to save deck.");

      throw err;
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
        throw new Error(
          data?.detail ||
            data?.error ||
            `Failed to add deck (${response.status}).`,
        );
      }

      const newDeck = data?.deck ?? data?.result ?? data;

      if (newDeck) {
        setDecks((currentDecks) => [...currentDecks, newDeck]);
      } else {
        await fetchDecks();
      }

      setAddingDeck(false);

      return newDeck;
    } catch (err) {
      console.error("Unable to add deck:", err);

      throw err;
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
        if (response.status === 403) {
          throw new Error(
            "Owner permissions are required to delete decklists.",
          );
        }

        throw new Error(
          await getApiErrorMessage(
            response,
            `Delete failed with status ${response.status}`,
          ),
        );
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

  return (
    <div className="deck-page">
      <main className="deck-content">
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
            adminForm
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
                src="https://cdn.pvzhtbot.com/icons/plants.png"
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
                src="https://cdn.pvzhtbot.com/icons/zombies.png"
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
          <p className="results-count">
            Showing {filteredDecks.length} of {decks.length} decks
          </p>
        )}

        {!error && filteredDecks.length === 0 ? (
          <p className="no-results">No decklists found.</p>
        ) : (
          !error && (
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
          <div className="admin-delete-dialog">Deleting deck...</div>
        </div>
      )}
    </div>
  );
}

export default AdminDecklists;
