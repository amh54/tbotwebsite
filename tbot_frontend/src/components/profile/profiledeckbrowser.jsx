import { useMemo, useState } from "react";

import DeckCard from "../modals/deckcomponent.jsx";

import FilterDropdown from "../filterdropdown";

import useTemporaryMessage from "../../utils/useTemporaryMessage";

import {
  normalizeSide,
  normalizeKey,
  buildCollectionMap,
  sortDecks,
  getFilterOptions,
  filterDecks,
} from "../../utils/deckFilters";

import "../../css/userdecklists.css";

function ProfileDeckBrowser({
  decks = [],
  allCards = [],
  viewerCards = [],
  profileSlug,
  profileName,
  profileIsPublic,
  sharedDeckKey = "",
  isAuthenticated = false,
}) {
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collection, setCollection] = useState([]);

  const { visible: collectionLoginMessage, show: showCollectionLoginMessage } =
    useTemporaryMessage(4000);

  const collectionMap = useMemo(() => {
    if (!isAuthenticated) {
      return new Map();
    }

    return buildCollectionMap(viewerCards);
  }, [viewerCards, isAuthenticated]);

  const sortedDecks = useMemo(() => sortDecks(decks), [decks]);

  const { heroOptions, categoryOptions, archetypeOptions, collectionOptions } =
    useMemo(
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
          <h2>{profileName}'s Personal Decks</h2>

          <p>
            {decks.length === 0
              ? "0 decklists"
              : `${decks.length} ${
                  decks.length === 1 ? "decklist" : "decklists"
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
            <span>Log in with Discord to use the Collection filter.</span>
          </div>
        )}
      </div>

      <div className="user-decklists-results-bar">
        <p className="results-count">
          Showing {filteredDecks.length} of {decks.length} decks
        </p>
      </div>

      {filteredDecks.length === 0 ? (
        <div className="user-decklists-empty">
          <h2>No decks found</h2>

          <p>This user hasn't added any decks matching these filters.</p>
        </div>
      ) : (
        <div className="deck-grid">
          {filteredDecks.map((deck) => {
            const deckId =
              deck.deckid ?? deck.deckID ?? deck.deckId ?? deck.id ?? "";

            const deckName = String(deck.name || "deck")
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");

            const shareDeckKey = deckName
              ? `${deckName}-${deckId}`
              : String(deckId);

            const isSharedDeck =
              Boolean(sharedDeckKey) &&
              (String(sharedDeckKey) === String(deckId) ||
                String(sharedDeckKey) === shareDeckKey);

            return (
              <DeckCard
                key={`user-deck-${deck.deckid || deck.deckID || deck.id || `${normalizeSide(deck.side)}-${normalizeKey(deck.name)}`}`}
                decklist={deck}
                allCards={allCards}
                profileSlug={profileSlug}
                profileIsPublic={profileIsPublic}
                showSuggestDeck={true}
                autoOpen={isSharedDeck}
                isUserDeck={true}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProfileDeckBrowser;
