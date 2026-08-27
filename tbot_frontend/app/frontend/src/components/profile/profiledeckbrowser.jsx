import { useMemo, useState } from "react";

import DeckCard from "../deckcomponent";

import FilterDropdown from "../filterdropdown";

import {
  ARCHETYPE_META,
  CATEGORY_META,
  COLLECTION_OPTIONS,
  HERO_ALIAS,
  normalizeText,
  normalizeKey,
  normalizeSide,
  parseDeckCards,
  parseCategories,
  parseArchetypes,
  buildCollectionMap,
  getDeckCollectionStatus,
} from "../../utils/deckFilters";

import "../../css/userdecklists.css";

function ProfileDeckBrowser({
  decks = [],
  allCards = [],
  userCards = [],
  profileSlug,
  profileIsPublic,
}) {
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collection, setCollection] = useState([]);

  /*
   * --------------------------------------------------------------------------
   * Collection map
   * --------------------------------------------------------------------------
   */

  const collectionMap = useMemo(
    () => buildCollectionMap(userCards),
    [userCards],
  );

  /*
   * --------------------------------------------------------------------------
   * Side filtering
   * --------------------------------------------------------------------------
   */

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeSide(side);

    return decks.filter((deck) => normalizeSide(deck.side) === selectedSide);
  }, [decks, side]);

  /*
   * --------------------------------------------------------------------------
   * Hero options
   * --------------------------------------------------------------------------
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

  /*
   * --------------------------------------------------------------------------
   * Category options
   * --------------------------------------------------------------------------
   */

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();

    sideFilteredDecks.forEach((deck) => {
      const categories = parseCategories(deck.category);

      categories.forEach((categoryName) => {
        if (!CATEGORY_META[categoryName]) {
          return;
        }

        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            value: categoryName,
            label: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            count: 0,
            ...CATEGORY_META[categoryName],
          });
        }

        categoryMap.get(categoryName).count += 1;
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      }),
    );
  }, [sideFilteredDecks]);

  /*
   * --------------------------------------------------------------------------
   * Archetype options
   * --------------------------------------------------------------------------
   */

  const archetypeOptions = useMemo(() => {
    const counts = {};

    Object.keys(ARCHETYPE_META).forEach((key) => {
      counts[key] = 0;
    });

    sideFilteredDecks.forEach((deck) => {
      const deckArchetypes = parseArchetypes(deck.archetype);

      Object.keys(ARCHETYPE_META).forEach((archetypeName) => {
        if (deckArchetypes.includes(archetypeName)) {
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

  /*
   * --------------------------------------------------------------------------
   * Sort decks
   * --------------------------------------------------------------------------
   */

  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      const sideOrder = {
        plants: 0,
        zombies: 1,
      };

      const sideA = normalizeSide(a.side);
      const sideB = normalizeSide(b.side);

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

  /*
   * --------------------------------------------------------------------------
   * Collection dropdown counts
   * --------------------------------------------------------------------------
   *
   * Counts are calculated from the decks currently belonging to the
   * selected profile and the user's collection.
   *
   * Buildable = every card needed by the deck is owned.
   * Close = the deck is close to being buildable according to
   * getDeckCollectionStatus().
   * --------------------------------------------------------------------------
   */

  const collectionOptions = useMemo(() => {
    let buildableCount = 0;
    let closeCount = 0;

    decks.forEach((deck) => {
      const status = getDeckCollectionStatus(deck, collectionMap);

      if (status.buildable) {
        buildableCount += 1;
      }

      if (status.close) {
        closeCount += 1;
      }
    });

    return COLLECTION_OPTIONS.map((option) => {
      if (option.value === "buildable") {
        return {
          ...option,
          count: buildableCount,
        };
      }

      if (option.value === "close") {
        return {
          ...option,
          count: closeCount,
        };
      }

      return option;
    });
  }, [decks, collectionMap]);

  /*
   * --------------------------------------------------------------------------
   * Apply all filters
   * --------------------------------------------------------------------------
   */

  const filteredDecks = useMemo(() => {
    const searchValue = normalizeKey(search);

    const alias = HERO_ALIAS[searchValue]
      ? normalizeKey(HERO_ALIAS[searchValue])
      : "";

    return sortedDecks.filter((deck) => {
      /*
       * Search
       * ----------------------------------------------------------------------
       */

      const deckCards = parseDeckCards(deck.cards);

      const searchableCardValues = deckCards.map((card) => normalizeKey(card));

      const searchableValues = [
        deck.name,
        deck.creator,
        deck.optimization,
        deck.hero,
        deck.archetype,
        deck.category,
      ]
        .filter(Boolean)
        .map((value) => normalizeKey(value));

      let searchMatch = true;

      if (searchValue) {
        if (alias) {
          searchMatch = normalizeKey(deck.hero).includes(alias);
        } else {
          const normalFieldMatch = searchableValues.some((value) =>
            value.includes(searchValue),
          );

          const cardMatch = searchableCardValues.some((card) =>
            card.includes(searchValue),
          );

          searchMatch = normalFieldMatch || cardMatch;
        }
      }

      /*
       * Side
       * ----------------------------------------------------------------------
       */

      const deckSide = normalizeSide(deck.side);

      const sideMatch = side === "All" || deckSide === normalizeSide(side);

      /*
       * Hero
       * ----------------------------------------------------------------------
       */

      const heroMatch =
        hero.length === 0 ||
        hero.some(
          (selectedHero) =>
            normalizeKey(deck.hero) === normalizeKey(selectedHero.value),
        );

      /*
       * Category
       * ----------------------------------------------------------------------
       */

      const deckCategories = parseCategories(deck.category);

      const categoryMatch =
        category.length === 0 ||
        category.every((selectedCategory) =>
          deckCategories.includes(normalizeKey(selectedCategory.value)),
        );

      /*
       * Archetype
       * ----------------------------------------------------------------------
       */

      const deckArchetypes = parseArchetypes(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          deckArchetypes.includes(normalizeKey(selectedArchetype.value)),
        );

      /*
       * Collection
       * ----------------------------------------------------------------------
       */

      const collectionMatch =
        collection.length === 0 ||
        collection.every((selectedCollection) => {
          const status = getDeckCollectionStatus(deck, collectionMap);

          if (selectedCollection.value === "buildable") {
            return status.buildable;
          }

          if (selectedCollection.value === "close") {
            return status.close;
          }

          return true;
        });

      return (
        searchMatch &&
        sideMatch &&
        heroMatch &&
        categoryMatch &&
        archetypeMatch &&
        collectionMatch
      );
    });
  }, [
    sortedDecks,
    search,
    side,
    hero,
    category,
    archetype,
    collection,
    collectionMap,
  ]);

  /*
   * --------------------------------------------------------------------------
   * Clear filters
   * --------------------------------------------------------------------------
   */

  const clearFilters = () => {
    setSearch("");
    setHero([]);
    setCategory([]);
    setArchetype([]);
    setCollection([]);
  };

  /*
   * --------------------------------------------------------------------------
   * Side change
   * --------------------------------------------------------------------------
   */

  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  /*
   * --------------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------------
   */

  return (
    <section className="profile-decks">
      <div className="profile-decks-header">
        <div>
          <h2>Decklists</h2>

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
              onChange={setCollection}
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

          <p>This user hasn't added any decks matching these filters.</p>
        </div>
      ) : (
        <div className="deck-grid">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={
                deck.deckid ||
                deck.deckID ||
                deck.id ||
                `${normalizeSide(deck.side)}-${normalizeKey(deck.name)}`
              }
              decklist={deck}
              allCards={allCards}
              profileSlug={profileSlug}
              profileIsPublic={profileIsPublic}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProfileDeckBrowser;
