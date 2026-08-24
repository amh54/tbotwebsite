import { useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

import ProfileHeader from "../components/profile/profileheader.jsx";
import ProfileTabs from "../components/profile/profiletabs.jsx";
import ProfileCardBrowser from "../components/profile/profilecardbrowser.jsx";
import ProfileDeckBrowser from "../components/profile/profiledeckbrowser.jsx";
import ProfileShareMessage from "../components/profile/profilesharemessage.jsx";
import ProfileEditModal from "../components/profile/profileeditmodal.jsx";
import "../css/profile.css";
import "../css/decklists.css";
import "../css/navbar.css";
import "../css/loading.css";
import "../css/profilecards.css";
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

function Profile() {
  const { profile_slug } = useParams();
  const [userCards, setUserCards] = useState([]);
  const [profile, setProfile] = useState(null);
  const [decks, setDecks] = useState([]);
  const [deckCount, setDeckCount] = useState(null);
  const [allCards, setAllCards] = useState([]);

  const [activeTab, setActiveTab] = useState("cards");

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

       const cardsResponse = await fetch(
  `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(
    profile_slug,
  )}/cards/`,
  {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: controller.signal,
  },
);

        const cardsData = await cardsResponse.json().catch(() => null);

        if (cardsResponse.ok) {
          setUserCards(
            Array.isArray(cardsData) ? cardsData : cardsData?.cards || [],
          );
        }
        const allCardsResponse = await fetch(
          `${API_BASE_URL}/tbotapp/cardinfo/`,
          {
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        const allCardsData = await allCardsResponse.json().catch(() => null);

        if (allCardsResponse.ok) {
          setAllCards(
            Array.isArray(allCardsData)
              ? allCardsData
              : allCardsData?.results || [],
          );
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
   * Share profile.
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
   * Deck filtering options.
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

  /*
   * Sort decks.
   */
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

  /*
   * Apply deck filters.
   */
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

  /*
   * Changing Plants/Zombies also
   * clears the current deck filters.
   */
  const handleSideChange = (newSide) => {
    setSide(newSide);
    clearFilters();
  };

  /*
   * Loading state.
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
   * Error state.
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

  return (
    <div className="profile-page-wrapper">
      <Navbar />

      <main className="profile-page">
        <ProfileHeader
          profile={profile}
          profileName={profileName}
          isOwner={isOwner}
          onShare={handleShareProfile}
          onEdit={openEditProfile}
        />

        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="profile-tab-content">
          {activeTab === "cards" && (
            <ProfileCardBrowser cards={userCards} allCards={allCards} />
          )}

          {activeTab === "decks" && (
            <ProfileDeckBrowser
              decks={decks}
              filteredDecks={filteredDecks}
              allCards={allCards}
              profile={profile}
              profileSlug={profile_slug}
              deckCount={deckCount}
              side={side}
              onSideChange={handleSideChange}
              search={search}
              setSearch={setSearch}
              hero={hero}
              setHero={setHero}
              category={category}
              setCategory={setCategory}
              archetype={archetype}
              setArchetype={setArchetype}
              heroOptions={heroOptions}
              categoryOptions={categoryOptions}
              archetypeOptions={archetypeOptions}
              onClearFilters={clearFilters}
            />
          )}
        </div>

        {isSiteOwner && (
          <div
            style={{
              display: "none",
            }}
          >
            Site owner profile access enabled.
          </div>
        )}
      </main>

      <ProfileShareMessage message={shareMessage} />

      <ProfileEditModal
        open={editOpen}
        saving={saving}
        error={editError}
        displayName={editDisplayName}
        profileSlug={editProfileSlug}
        bio={editBio}
        isPublic={editIsPublic}
        onDisplayNameChange={setEditDisplayName}
        onProfileSlugChange={setEditProfileSlug}
        onBioChange={setEditBio}
        onPublicChange={setEditIsPublic}
        onSubmit={handleSaveProfile}
        onClose={closeEditProfile}
      />

      <Footer />
    </div>
  );
}

export default Profile;
