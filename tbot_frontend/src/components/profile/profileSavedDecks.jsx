import { useMemo, useState } from "react";

import DeckCard from "../modals/deckcomponent.jsx";

import FilterDropdown from "../filterdropdown";

import useTemporaryMessage from "../../utils/useTemporaryMessage";

import {
  buildCollectionMap,
  sortDecks,
  getFilterOptions,
  filterDecks,
} from "../../utils/deckFilters";

import "../../css/userdecklists.css";

function normalizeSavedSourceType(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "user_deck" || normalized === "user") {
    return "user_deck";
  }

  if (normalized === "legacy") {
    return "legacy";
  }

  return "decklist";
}

function ProfileSavedDecks({
  savedDecks = [],
  allCards = [],
  viewerCards = [],
  profileSlug,
  profileIsPublic,
  isAuthenticated = false,
  onRemoveSaved,
}) {
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collection, setCollection] = useState([]);

  const {
    visible: collectionLoginMessage,
    show: showCollectionLoginMessage,
  } = useTemporaryMessage(4000);

  const collectionMap = useMemo(() => {
    if (!isAuthenticated) {
      return new Map();
    }

    return buildCollectionMap(viewerCards);
  }, [viewerCards, isAuthenticated]);

  const sortedDecks = useMemo(
    () => sortDecks(savedDecks),
    [savedDecks],
  );

  const {
    heroOptions,
    categoryOptions,
    archetypeOptions,
    collectionOptions,
  } = useMemo(
    () =>
      getFilterOptions({
        decks: sortedDecks,
        allCards,
        search,
        side,
        hero,
        category,
        archetype,
        collection,
        collectionMap,
        collectionLoading: false,
        collectionLoaded: isAuthenticated,
        discordUser: isAuthenticated ? {} : null,
        authLoading: false,
      }),
    [
      sortedDecks,
      allCards,
      search,
      side,
      hero,
      category,
      archetype,
      collection,
      collectionMap,
      isAuthenticated,
    ],
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
        collection,
        collectionMap,
        collectionLoading: false,
        collectionLoaded: isAuthenticated,
        discordUser: isAuthenticated ? {} : null,
      }),
    [
      sortedDecks,
      search,
      side,
      hero,
      category,
      archetype,
      collection,
      collectionMap,
      isAuthenticated,
    ],
  );

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollection([]);
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  const handleCollectionChange = (value) => {
    if (!isAuthenticated) {
      showCollectionLoginMessage();
      return;
    }

    setCollection(value);
  };

  return (
    <section className="profile-decks">
      <div className="profile-decks-header">
        <div>
          <h2>Saved Decks</h2>
          <p>
            {savedDecks.length === 0
              ? "0 saved decks"
              : `${savedDecks.length} ${
                  savedDecks.length === 1
                    ? "saved deck"
                    : "saved decks"
                }`}
          </p>
        </div>
      </div>

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
            placeholder="Search saved decks, creators, heroes, cards..."
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

          <div className="select-wrapper">
            <FilterDropdown
              label="Collection"
              options={collectionOptions}
              value={collection}
              onChange={handleCollectionChange}
              multi
              requiresAuth
              isAuthenticated={isAuthenticated}
              onAuthRequired={showCollectionLoginMessage}
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

        {collectionLoginMessage && (
          <div className="collection-login-message">
            <strong>Discord login required</strong>
            <span>
              Log in with Discord to use the Collection filter.
            </span>
          </div>
        )}
      </div>

      <div className="user-decklists-results-bar">
        <p className="results-count">
          Showing {filteredDecks.length} of {savedDecks.length} saved decks
        </p>
      </div>

      {filteredDecks.length === 0 ? (
        <div className="user-decklists-empty">
          <h2>
            {savedDecks.length === 0
              ? "No saved decks"
              : "No decks found"}
          </h2>

          <p>
            {savedDecks.length === 0
              ? "Save a deck to add it to your Saved Decks."
              : "You don't have any saved decks matching these filters."}
          </p>
        </div>
      ) : (
        <div className="deck-grid">
          {filteredDecks.map((deck) => {
            const sourceDeckId =
              deck.source_deck_id ??
              deck.sourceDeckId ??
              "";

            const sourceType = normalizeSavedSourceType(
              deck.source_type ?? deck.sourceType,
            );

            return (
              <DeckCard
                key={`saved-deck-${sourceType}-${
                  sourceDeckId || deck.id || "unknown"
                }`}
                decklist={{
                  ...deck,
                  source_type: sourceType,
                  source_deck_id: sourceDeckId,
                }}
                allCards={allCards}
                profileSlug={profileSlug}
                profileIsPublic={profileIsPublic}
                showSuggestDeck={false}
                autoOpen={false}
                isUserDeck={false}
                isSavedDeck={true}
                savedDeckTab={true}
                onRemoveSaved={onRemoveSaved}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProfileSavedDecks;