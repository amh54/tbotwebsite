import { useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import DeckCard from "../components/deckcomponent";
import FilterDropdown from "../components/filterdropdown";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

import "../css/profile.css";
import "../css/decklists.css";
import "../css/navbar.css";
import "../css/loading.css";
import "../css/userdecklists.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:8000";
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

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

const getAvatarUrl = (profile) => {
  if (!profile) {
    return "";
  }

  const avatar = normalizeText(profile.avatar);
  const discordId = normalizeText(profile.discord_id);

  if (!avatar) {
    if (discordId) {
      const numericId = Number(discordId);

      if (Number.isSafeInteger(numericId) && numericId >= 0) {
        const defaultAvatarIndex = (numericId >> 22) % 6;

        return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
      }
    }

    return "";
  }

  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("//")
  ) {
    return avatar;
  }

  if (avatar.startsWith("/avatars/") || avatar.startsWith("/embed/avatars/")) {
    return `https://cdn.discordapp.com${avatar}`;
  }

  if (!discordId) {
    return "";
  }

  const extension = avatar.startsWith("a_") ? "gif" : "png";

  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
};

function Profile() {
  const { profile_slug } = useParams();

  const [profile, setProfile] = useState(null);
  const [decks, setDecks] = useState([]);
  const [deckCount, setDeckCount] = useState(null);
  const [allCards, setAllCards] = useState([]);

  const [search, setSearch] = useState("");
  const [side, setSide] = useState("All");
  const [hero, setHero] = useState([]);
  const [category, setCategory] = useState([]);
  const [archetype, setArchetype] = useState([]);

  const [isOwner, setIsOwner] = useState(false);
  const [isSiteOwner, setIsSiteOwner] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [editDisplayName, setEditDisplayName] = useState("");
  const [editProfileSlug, setEditProfileSlug] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);

  const [shareMessage, setShareMessage] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  /*
   * Load the profile, decks, and card information together.
   *
   * This replaces the old separate Profile and UserDecklists pages.
   */
  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      if (!profile_slug) {
        setLoading(false);
        setError("Profile not found.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setAvatarError(false);

        /*
         * Load profile.
         */
        const profileResponse = await fetch(
          `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(
            profile_slug,
          )}/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            signal: controller.signal,
          },
        );

        const profileData = await profileResponse.json().catch(() => null);

        if (!profileResponse.ok) {
          throw new Error(profileData?.error || "Unable to load profile.");
        }

        const loadedProfile = profileData?.profile || null;

        if (!loadedProfile) {
          throw new Error("Profile data was not returned.");
        }

        setProfile(loadedProfile);
        setIsOwner(Boolean(profileData?.is_owner));
        setIsSiteOwner(Boolean(profileData?.is_site_owner));

        /*
         * Load the user's decks.
         */
        const deckResponse = await fetch(
          `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(
            profile_slug,
          )}/decks/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            signal: controller.signal,
          },
        );

        const deckData = await deckResponse.json().catch(() => null);

        if (!deckResponse.ok) {
          throw new Error(
            deckData?.error || "Unable to load this user's decklists.",
          );
        }

        const loadedDecks = Array.isArray(deckData?.decks)
          ? deckData.decks
          : [];

        setDecks(loadedDecks);
        setDeckCount(loadedDecks.length);

        /*
         * Load card information.
         *
         * This is needed by the hero filter and DeckCard component.
         */
        try {
          const cardsResponse = await fetch(
            `${API_BASE_URL}/tbotapp/cardinfo/`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              signal: controller.signal,
            },
          );

          if (cardsResponse.ok) {
            const cardsData = await cardsResponse.json();

            setAllCards(
              Array.isArray(cardsData)
                ? cardsData
                : Array.isArray(cardsData?.results)
                  ? cardsData.results
                  : [],
            );
          }
        } catch (cardError) {
          if (cardError.name !== "AbortError") {
            console.error("Unable to load card information:", cardError);
          }
        }

        if (!controller.signal.aborted) {
          setLoading(false);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load profile:", err);

        setProfile(null);
        setDecks([]);
        setDeckCount(0);
        setIsOwner(false);
        setIsSiteOwner(false);
        setError(err.message || "Unable to load profile.");
        setLoading(false);
      }
    };

    loadProfile();

    return () => controller.abort();
  }, [profile_slug]);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar, profile?.discord_id]);

  /*
   * Profile editing
   */
  const openEditProfile = () => {
    if (!profile) {
      return;
    }

    setEditDisplayName(profile.display_name || "");
    setEditProfileSlug(profile.profile_slug || "");
    setEditBio(profile.bio || "");
    setEditIsPublic(Boolean(profile.is_public));
    setEditError("");
    setEditOpen(true);
  };

  const closeEditProfile = () => {
    if (saving) {
      return;
    }

    setEditOpen(false);
    setEditError("");
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!editDisplayName.trim()) {
      setEditError("Display name cannot be empty.");
      return;
    }

    if (!editProfileSlug.trim()) {
      setEditError("Profile URL cannot be empty.");
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const response = await fetch(`${API_BASE_URL}/tbotapp/profile/update/`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          display_name: editDisplayName.trim(),
          profile_slug: editProfileSlug.trim().toLowerCase(),
          bio: editBio,
          is_public: editIsPublic,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update profile.");
      }

      const updatedProfile = data?.profile;

      if (!updatedProfile) {
        throw new Error(
          "Profile was updated, but no profile data was returned.",
        );
      }

      setProfile(updatedProfile);
      setEditOpen(false);
      setEditError("");

      const newSlug = normalizeText(updatedProfile.profile_slug);

      /*
       * Update the URL without forcing a full page reload.
       */
      if (newSlug && newSlug !== profile_slug) {
        window.history.replaceState(
          {},
          "",
          `/profile/${encodeURIComponent(newSlug)}`,
        );
      }
    } catch (err) {
      console.error("Unable to update profile:", err);

      setEditError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  /*
   * Single Share Profile button.
   *
   * There is intentionally NO "Share Deck Profile" button anymore.
   */
  const handleShareProfile = async () => {
    const currentSlug = normalizeText(profile?.profile_slug) || profile_slug;

    if (!currentSlug) {
      setShareMessage("Unable to create profile link.");
      return;
    }

    const profileUrl =
      `${window.location.origin}/profile/` + encodeURIComponent(currentSlug);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const textArea = document.createElement("textarea");

        textArea.value = profileUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand("copy");

        document.body.removeChild(textArea);
      }

      setShareMessage("Profile link copied!");
    } catch (err) {
      console.error("Unable to copy profile link:", err);

      setShareMessage("Unable to copy profile link.");
    }

    window.setTimeout(() => {
      setShareMessage("");
    }, 2500);
  };

  /*
   * Filtering
   */
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
          side: normalizeKey(deck.side),
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
            ...(CATEGORY_META[categoryName] || {}),
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

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading profile</h2>

          <p>Preparing this user's profile and decklists.</p>

          <div className="loading-status">
            <span>Loading deck data</span>

            <strong>
              {deckCount !== null
                ? `${deckCount} ${deckCount === 1 ? "deck" : "decks"}`
                : "Loading..."}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (error) {
    return (
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-error">{error}</div>
        </main>

        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-error">Profile not found.</div>
        </main>

        <Footer />
      </div>
    );
  }

  const profileName = profile.display_name || profile.username || "User";

  const avatarUrl = getAvatarUrl(profile);

  return (
    <div className="profile-page-wrapper">
      <Navbar />

      <main className="profile-page">
        {/* =========================
            PROFILE HEADER
        ========================== */}
        <section className="profile-header">
          <div className="profile-avatar">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={`${profileName} avatar`}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {profileName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1>{profileName}</h1>

            <div className="profile-username">
              @
              {profile.username ||
                profile.discord_username ||
                profile.display_name}
            </div>

            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-meta">
              {profile.is_public ? "Public profile" : "Private profile"}
            </div>
          </div>

          <div className="profile-header-actions">
            <button
              type="button"
              className="profile-share-button"
              onClick={handleShareProfile}
            >
              Share Profile
            </button>

            {isOwner && (
              <button
                type="button"
                className="profile-edit-button"
                onClick={openEditProfile}
              >
                Edit Profile
              </button>
            )}
          </div>
        </section>

        {/* =========================
            DECKLIST SECTION
        ========================== */}
        <section className="profile-decks">
          <div className="profile-decks-header">
            <div>
              <h2>Decklists</h2>

              <p>
                {deckCount === 0
                  ? "0 decklists"
                  : `${deckCount} ${
                      deckCount === 1 ? "decklist" : "decklists"
                    }`}
              </p>
            </div>
          </div>

          <div className="deck-browser">
            {/* SIDE TABS */}
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

            {/* SEARCH */}
            <div className="search-container">
              <input
                className="search"
                placeholder="Search decks, creators, heroes, cards..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {/* FILTERS */}
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

          {/* RESULTS */}
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
                  profileSlug={
                    normalizeText(profile.profile_slug) || profile_slug
                  }
                  profileIsPublic={profile.is_public === true}
                />
              ))}
            </div>
          )}
        </section>

        {isSiteOwner && (
          <div style={{ display: "none" }}>
            Site owner profile access enabled.
          </div>
        )}
      </main>

      {/* SHARE MESSAGE */}
      {shareMessage && (
        <div className="profile-share-message">{shareMessage}</div>
      )}

      {/* =========================
          EDIT PROFILE MODAL
      ========================== */}
      {editOpen && (
        <div
          className="profile-edit-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProfile();
            }
          }}
        >
          <div className="profile-edit-modal">
            <h2>Edit Profile</h2>

            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              {editError && (
                <div className="profile-edit-error">{editError}</div>
              )}

              <div className="profile-edit-field">
                <label htmlFor="profile-display-name">Display Name</label>

                <input
                  id="profile-display-name"
                  type="text"
                  value={editDisplayName}
                  maxLength={100}
                  onChange={(event) => setEditDisplayName(event.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="profile-edit-field">
                <label htmlFor="profile-slug">Profile URL</label>

                <input
                  id="profile-slug"
                  type="text"
                  value={editProfileSlug}
                  maxLength={100}
                  onChange={(event) =>
                    setEditProfileSlug(
                      event.target.value.toLowerCase().replace(/\s+/g, "-"),
                    )
                  }
                  disabled={saving}
                />

                <small>
                  Your profile will be available at
                  {" /profile/"}
                  {editProfileSlug || "your-name"}
                </small>
              </div>

              <div className="profile-edit-field">
                <label htmlFor="profile-bio">Bio</label>

                <textarea
                  id="profile-bio"
                  value={editBio}
                  maxLength={2000}
                  onChange={(event) => setEditBio(event.target.value)}
                  placeholder="Tell people a little about yourself..."
                  disabled={saving}
                />

                <small>{editBio.length}/2000 characters</small>
              </div>

              <div className="profile-public-toggle">
                <div className="profile-public-toggle-info">
                  <p className="profile-public-toggle-title">Public Profile</p>

                  <p className="profile-public-toggle-description">
                    Public profiles can be discovered by other users. Private
                    profiles can still be shared directly with someone using the
                    profile link.
                  </p>
                </div>

                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={editIsPublic}
                    onChange={(event) => setEditIsPublic(event.target.checked)}
                    disabled={saving}
                  />

                  <span className="profile-switch-slider" />
                </label>
              </div>

              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="profile-edit-cancel"
                  onClick={closeEditProfile}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-edit-save"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Profile;
