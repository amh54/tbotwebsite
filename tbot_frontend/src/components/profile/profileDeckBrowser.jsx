import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import DeckCard from "../modals/deckComponent.jsx";

import FilterDropdown from "../filterDropdown.jsx";
import RandomDeckButton from "../decks/randomDeckButton.jsx";
import useTemporaryMessage from "../../utils/useTemporaryMessage";

import {
  normalizeSide,
  normalizeKey,
  buildCollectionMap,
  sortDecks,
  getFilterOptions,
  getHeroOptions,
  getCategoryOptions,
  getArchetypeOptions,
  COLLECTION_OPTIONS,
  filterDecks,
} from "../../utils/deckFilters";

import "../../css/userDecklists.css";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const side = searchParams.get("side") || "All";

  const selectedHeroValues = searchParams.getAll("hero");
  const selectedCategoryValues = searchParams.getAll("category");
  const selectedArchetypeValues = searchParams.getAll("archetype");
  const selectedCollectionValues = searchParams.getAll("collection");

  const updateFilters = (updates) => {
    const replace = Object.keys(updates).length === 1 && "search" in updates;

    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        Object.entries(updates).forEach(([key, value]) => {
          nextParams.delete(key);

          const values = Array.isArray(value) ? value : [value];

          values.forEach((item) => {
            const paramValue =
              item && typeof item === "object" ? item.value : item;

            if (
              paramValue === null ||
              paramValue === undefined ||
              paramValue === "" ||
              (key === "side" && paramValue === "All")
            ) {
              return;
            }

            nextParams.append(key, String(paramValue));
          });
        });

        return nextParams;
      },
      { replace },
    );
  };

  const setSearch = (value) => updateFilters({ search: value });
  const setHero = (value) => updateFilters({ hero: value });
  const setCategory = (value) => updateFilters({ category: value });
  const setArchetype = (value) => updateFilters({ archetype: value });
  const setCollection = (value) => updateFilters({ collection: value });
  const [randomSelection, setRandomSelection] = useState({
    deckKey: null,
    version: 0,
  });

  const handleRandomDeck = (deck) => {
    const deckId = deck.deckid ?? deck.deckID ?? deck.deckId ?? deck.id ?? "";

    const deckKey = `user-deck-${
      deckId || `${normalizeSide(deck.side)}-${normalizeKey(deck.name)}`
    }`;

    setRandomSelection((current) => ({
      deckKey,
      version: current.version + 1,
    }));
  };

  const handleRandomDeckOpened = () => {
    setRandomSelection((current) => ({
      ...current,
      deckKey: null,
    }));
  };
  const { visible: collectionLoginMessage, show: showCollectionLoginMessage } =
    useTemporaryMessage(4000);

  const collectionMap = useMemo(() => {
    if (!isAuthenticated) {
      return new Map();
    }

    return buildCollectionMap(viewerCards);
  }, [viewerCards, isAuthenticated]);

  const sortedDecks = useMemo(() => sortDecks(decks), [decks]);
  const baseHeroOptions = useMemo(
    () => getHeroOptions(sortedDecks, allCards),
    [sortedDecks, allCards],
  );

  const baseCategoryOptions = useMemo(
    () => getCategoryOptions(sortedDecks),
    [sortedDecks],
  );

  const baseArchetypeOptions = useMemo(
    () => getArchetypeOptions(sortedDecks),
    [sortedDecks],
  );

  const resolveSelectedOptions = (values, options) => {
    const optionsByValue = new Map(
      options.map((option) => [normalizeKey(option.value), option]),
    );

    return values
      .map((value) => optionsByValue.get(normalizeKey(value)))
      .filter(Boolean);
  };

  const hero = resolveSelectedOptions(selectedHeroValues, baseHeroOptions);
  const category = resolveSelectedOptions(
    selectedCategoryValues,
    baseCategoryOptions,
  );
  const archetype = resolveSelectedOptions(
    selectedArchetypeValues,
    baseArchetypeOptions,
  );
  const collection = resolveSelectedOptions(
    selectedCollectionValues,
    COLLECTION_OPTIONS,
  );
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
  updateFilters({
    search: "",
    hero: [],
    category: [],
    archetype: [],
    collection: [],
  });
};

const handleSideChange = (newSide) => {
  updateFilters({
    side: newSide,
    search: "",
    hero: [],
    category: [],
    archetype: [],
    collection: [],
  });
};

const handleCollectionChange = (value) => {
  if (!isAuthenticated) {
    showCollectionLoginMessage();
    return;
  }

  setCollection(value);
};

  let deckLabel = "decklists";

  if (decks.length === 1) {
    deckLabel = "decklist";
  }

  let deckCountLabel = "0 decklists";

  if (decks.length > 0) {
    deckCountLabel = `${decks.length} ${deckLabel}`;
  }

  return (
    <section className="profile-decks">
      <div className="profile-decks-header">
        <div>
          <h2>{profileName}'s Personal Decks</h2>

          <p>{deckCountLabel}</p>
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
              src="https://cdn.pvzhtbot.com/icons/plants.png"
              alt="Plants"
              className="tab-icon"
            />
            <span>Plants</span>
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
            <span>Zombies</span>
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
        <div className="random-deck-toolbar">
          <RandomDeckButton
            decks={filteredDecks}
            selectedDeckKey={randomSelection.deckKey}
            onSelectDeck={handleRandomDeck}
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

            const deckKey = `user-deck-${
              deckId || `${normalizeSide(deck.side)}-${normalizeKey(deck.name)}`
            }`;

            const deckName = String(deck.name || "deck")
              .trim()
              .toLowerCase()
              .split("")
              .map((char) => (/[a-z0-9]/.test(char) ? char : "-"))
              .join("")
              .replace(/-+/, "-")
              .replace(/^-|-$/g, "");

            const shareDeckKey = deckName
              ? `${deckName}-${deckId}`
              : String(deckId);

            const isSharedDeck =
              Boolean(sharedDeckKey) &&
              (String(sharedDeckKey) === String(deckId) ||
                String(sharedDeckKey) === shareDeckKey);

            const isRandomSelection = randomSelection.deckKey === deckKey;

            return (
              <DeckCard
                key={deckKey}
                decklist={deck}
                allCards={allCards}
                profileSlug={profileSlug}
                profileIsPublic={profileIsPublic}
                showSuggestDeck={true}
                autoOpen={isSharedDeck}
                randomOpenKey={isRandomSelection ? randomSelection.version : 0}
                onRandomOpen={handleRandomDeckOpened}
                isUserDeck={true}
                userCollection={viewerCards}
                collectionLoaded={isAuthenticated}
                discordUser={isAuthenticated ? {} : null}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProfileDeckBrowser;
