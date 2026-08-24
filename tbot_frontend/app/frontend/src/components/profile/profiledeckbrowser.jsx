import { useMemo, useState } from "react";

import DeckCard from "../deckcomponent";
import FilterDropdown from "../filterdropdown";
import "../../css/userdecklists.css"
const ARCHETYPE_META = {
  aggro: {
    icon: "⚡",
    description:
      "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7.",
  },
  combo: {
    icon: "🧩",
    description:
      "Uses a specific card synergy to do massive damage to the opponent (OTK or One Turn Kill decks).",
  },
  midrange: {
    icon: "⚖️",
    description:
      "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the opponent.",
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

const normalizeText = (value) => String(value ?? "").trim();

const normalizeKey = (value) => normalizeText(value).toLowerCase();

const parseDeckCards = (value) => {
  return String(value ?? "")
    .replace(/\\\\\r\n/g, "\n")
    .replace(/\\\\\n/g, "\n")
    .replace(/\\\\\r/g, "\r")
    .split(/\r?\n|,/)
    .map((card) => card.trim())
    .filter(Boolean);
};

const parseCategories = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[\s,;/|]+/)
    .map((category) => category.trim())
    .filter(Boolean);
};

const parseArchetypes = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[\s,;/|]+/)
    .map((archetype) => archetype.trim())
    .filter(Boolean);
};

function ProfileDeckBrowser({ decks, allCards, profileSlug, profileIsPublic }) {
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);

  const sideFilteredDecks = useMemo(() => {
    if (side === "All") {
      return decks;
    }

    const selectedSide = normalizeKey(side);

    return decks.filter((deck) => normalizeKey(deck.side) === selectedSide);
  }, [decks, side]);

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

  const filteredDecks = useMemo(() => {
    const searchValue = normalizeKey(search);

    const alias = HERO_ALIAS[searchValue]
      ? normalizeKey(HERO_ALIAS[searchValue])
      : "";

    return sortedDecks.filter((deck) => {
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

      const deckSide = normalizeKey(deck.side);

      const sideMatch = side === "All" || deckSide === normalizeKey(side);

      const heroMatch =
        hero.length === 0 ||
        hero.some(
          (selectedHero) =>
            normalizeKey(deck.hero) === normalizeKey(selectedHero.value),
        );

      const deckCategories = parseCategories(deck.category);

      const categoryMatch =
        category.length === 0 ||
        category.every((selectedCategory) =>
          deckCategories.includes(normalizeKey(selectedCategory.value)),
        );

      const deckArchetypes = parseArchetypes(deck.archetype);

      const archetypeMatch =
        archetype.length === 0 ||
        archetype.every((selectedArchetype) =>
          deckArchetypes.includes(normalizeKey(selectedArchetype.value)),
        );

      return (
        searchMatch && sideMatch && heroMatch && categoryMatch && archetypeMatch
      );
    });
  }, [sortedDecks, search, side, hero, category, archetype]);

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
                `${deck.side}-${deck.name}`
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
