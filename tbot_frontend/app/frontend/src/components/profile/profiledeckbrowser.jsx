import { useMemo, useState } from "react";

import DeckCard from "../deckcomponent";
import FilterDropdown from "../filterdropdown";
import useTemporaryMessage from "../../utils/useTemporaryMessage";

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
  sharedDeckKey = "",
}) {
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);
  const [collection, setCollection] = useState([]);
  const { visible: collectionLoginMessage, show: showCollectionLoginMessage } =
    useTemporaryMessage(4000);
  /*
   * userCards is the logged-in user's collection.
   *
   * If there is no collection available, treat the user as
   * unauthenticated for purposes of the Collection filter.
   */
  const isAuthenticated = Array.isArray(userCards) && userCards.length > 0;

  const collectionMap = useMemo(
    () => buildCollectionMap(userCards),
    [userCards],
  );

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeSide(side);

    return decks.filter((deck) => normalizeSide(deck?.side) === selectedSide);
  }, [decks, side]);

  const matchesSearch = (deck) => {
    const searchValue = normalizeKey(search);

    if (!searchValue) {
      return true;
    }

    const alias = HERO_ALIAS[searchValue]
      ? normalizeKey(HERO_ALIAS[searchValue])
      : "";

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

    if (alias) {
      return normalizeKey(deck.hero).includes(alias);
    }

    return (
      searchableValues.some((value) => value.includes(searchValue)) ||
      searchableCardValues.some((card) => card.includes(searchValue))
    );
  };

  const matchesHero = (deck, selectedHero = hero) => {
    if (selectedHero.length === 0) {
      return true;
    }

    return selectedHero.some(
      (selected) => normalizeKey(deck.hero) === normalizeKey(selected.value),
    );
  };

  const matchesCategory = (deck, selectedCategory = category) => {
    if (selectedCategory.length === 0) {
      return true;
    }

    const deckCategories = parseCategories(deck.category);

    return selectedCategory.every((selected) =>
      deckCategories.includes(normalizeKey(selected.value)),
    );
  };

  const matchesArchetype = (deck, selectedArchetype = archetype) => {
    if (selectedArchetype.length === 0) {
      return true;
    }

    const deckArchetypes = parseArchetypes(deck.archetype);

    return selectedArchetype.some((selected) =>
      deckArchetypes.includes(normalizeKey(selected.value)),
    );
  };

  const matchesCollection = (deck, selectedCollection = collection) => {
    if (selectedCollection.length === 0) {
      return true;
    }

    /*
     * If the user is not authenticated, the Collection filter
     * should not actually filter anything. The dropdown click
     * is handled separately by handleCollectionChange().
     */
    if (!isAuthenticated) {
      return true;
    }

    const status = getDeckCollectionStatus(deck, collectionMap);

    return selectedCollection.some((selected) => {
      if (selected.value === "buildable") {
        return status?.buildable === true;
      }

      if (selected.value === "close") {
        return status?.close === true;
      }

      return false;
    });
  };

  const heroOptions = useMemo(() => {
    const heroMap = new Map();

    sideFilteredDecks
      .filter((deck) => {
        return (
          matchesSearch(deck) &&
          matchesCategory(deck) &&
          matchesArchetype(deck) &&
          matchesCollection(deck)
        );
      })
      .forEach((deck) => {
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
          (card) =>
            normalizeKey(card?.card_name) === normalizeKey(option.label),
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
  }, [
    sideFilteredDecks,
    allCards,
    search,
    category,
    archetype,
    collection,
    collectionMap,
    isAuthenticated,
  ]);

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();

    sideFilteredDecks
      .filter((deck) => {
        return (
          matchesSearch(deck) &&
          matchesHero(deck) &&
          matchesArchetype(deck) &&
          matchesCollection(deck)
        );
      })
      .forEach((deck) => {
        const categories = parseCategories(deck.category);

        categories.forEach((categoryName) => {
          if (!CATEGORY_META[categoryName]) {
            return;
          }

          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, {
              value: categoryName,
              label:
                categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
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
  }, [
    sideFilteredDecks,
    search,
    hero,
    archetype,
    collection,
    collectionMap,
    isAuthenticated,
  ]);

  const archetypeOptions = useMemo(() => {
    const counts = {};

    Object.keys(ARCHETYPE_META).forEach((key) => {
      counts[key] = 0;
    });

    sideFilteredDecks
      .filter((deck) => {
        return (
          matchesSearch(deck) &&
          matchesHero(deck) &&
          matchesCategory(deck) &&
          matchesCollection(deck)
        );
      })
      .forEach((deck) => {
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
  }, [
    sideFilteredDecks,
    search,
    hero,
    category,
    collection,
    collectionMap,
    isAuthenticated,
  ]);

  const collectionOptions = useMemo(() => {
    /*
     * Always return the normal Collection options.
     *
     * When unauthenticated, the dropdown remains visible but
     * clicking it triggers the temporary login message.
     */
    if (!isAuthenticated) {
      return COLLECTION_OPTIONS;
    }

    const availableDecks = sideFilteredDecks.filter((deck) => {
      return (
        matchesSearch(deck) &&
        matchesHero(deck) &&
        matchesCategory(deck) &&
        matchesArchetype(deck)
      );
    });

    let buildableCount = 0;
    let closeCount = 0;

    availableDecks.forEach((deck) => {
      const status = getDeckCollectionStatus(deck, collectionMap);

      if (status?.buildable === true) {
        buildableCount += 1;
      }

      if (status?.close === true) {
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
  }, [
    sideFilteredDecks,
    isAuthenticated,
    collectionMap,
    search,
    hero,
    category,
    archetype,
  ]);

  const sortedDecks = useMemo(() => {
    const selectedArchetypes = archetype.map((selectedArchetype) =>
      normalizeKey(selectedArchetype.value),
    );

    return [...decks].sort((a, b) => {
      if (selectedArchetypes.length > 1) {
        const archetypesA = parseArchetypes(a.archetype);
        const archetypesB = parseArchetypes(b.archetype);

        const matchesA = selectedArchetypes.filter((selected) =>
          archetypesA.includes(selected),
        ).length;

        const matchesB = selectedArchetypes.filter((selected) =>
          archetypesB.includes(selected),
        ).length;

        if (matchesA !== matchesB) {
          return matchesB - matchesA;
        }
      }

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
  }, [decks, archetype]);

  const filteredDecks = useMemo(() => {
    return sortedDecks.filter((deck) => {
      const deckSide = normalizeSide(deck.side);

      const sideMatch = side === "All" || deckSide === normalizeSide(side);

      if (!sideMatch) {
        return false;
      }

      if (!matchesSearch(deck)) {
        return false;
      }

      if (!matchesHero(deck)) {
        return false;
      }

      if (!matchesCategory(deck)) {
        return false;
      }

      if (!matchesArchetype(deck)) {
        return false;
      }

      if (!matchesCollection(deck)) {
        return false;
      }

      return true;
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
    isAuthenticated,
  ]);

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
      showSuggestDeck={true}
      autoOpen={isSharedDeck}
    />
  )
          })}
        </div>
      )}
    </section>
  );
}

export default ProfileDeckBrowser;
