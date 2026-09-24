import { useEffect, useState } from "react";

import { useParams, useSearchParams } from "react-router-dom";

import Navbar from "../components/navbar.jsx";

import Footer from "../components/footer.jsx";

import Seo from "../components/seo.jsx";

import ProfileHeader from "../components/profile/profileheader.jsx";

import ProfileTabs from "../components/profile/profiletabs.jsx";

import ProfileCardBrowser from "../components/profile/profilecardbrowser.jsx";

import ProfileDeckBrowser from "../components/profile/profiledeckbrowser.jsx";

import ProfileSavedDecks from "../components/profile/profileSavedDecks.jsx";

import ProfileShareMessage from "../components/profile/profilesharemessage.jsx";

import ProfileEditModal from "../components/profile/profileeditmodal.jsx";

import "../css/profile.css";

import "../css/decklists.css";

import "../css/navbar.css";

import "../css/loading.css";

import "../css/profilecards.css";

import "../css/userdecklists.css";

import { API_BASE_URL } from "../utils/api.js";

const PROFILE_CACHE_DURATION = 30 * 60 * 1000;

const normalizeText = (value) => String(value ?? "").trim();

const normalizeKey = (value) => normalizeText(value).toLowerCase();

const getProfileCacheKey = (slug) => `tbot_profile_cache_${normalizeKey(slug)}`;

function Profile() {
  const { profile_slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [userCards, setUserCards] = useState([]);
  const [viewerCards, setViewerCards] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [decks, setDecks] = useState([]);
  const [savedDecks, setSavedDecks] = useState([]);
  const [allCards, setAllCards] = useState([]);

  const [activeTab, setActiveTab] = useState(() =>
    searchParams.has("deck") ? "decks" : "cards",
  );

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

    const loadViewerCollection = async () => {
      try {
        const profileResponse = await fetch(
          `${API_BASE_URL}/tbotapp/profile/me/`,
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

        if (!profileResponse.ok || !profileData?.authenticated) {
          setIsAuthenticated(false);
          setViewerCards([]);
          return;
        }

        setIsAuthenticated(true);

        const viewerSlug = profileData?.profile?.profile_slug;

        if (!viewerSlug) {
          console.error("Logged-in profile has no profile_slug.");
          setViewerCards([]);
          return;
        }

        const cardsResponse = await fetch(
          `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(
            viewerSlug,
          )}/cards/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            signal: controller.signal,
          },
        );

        const cardsData = await cardsResponse.json().catch(() => null);

        if (!cardsResponse.ok) {
          console.error(
            "Unable to load logged-in user's collection:",
            cardsData,
          );
          setViewerCards([]);
          return;
        }

        const loadedViewerCards = Array.isArray(cardsData)
          ? cardsData
          : Array.isArray(cardsData?.cards)
            ? cardsData.cards
            : [];

        setViewerCards(loadedViewerCards);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load viewer collection:", err);
          setIsAuthenticated(false);
          setViewerCards([]);
        }
      }
    };

    loadViewerCollection();

    return () => {
      controller.abort();
    };
  }, []);

  const handleProfileTabChange = (nextTab) => {
    if (nextTab === activeTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete("deck");
    nextParams.delete("tab");

    setSearchParams(nextParams, { replace: true });
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (!searchParams.has("deck")) {
      return;
    }

    const requestedTab = searchParams.get("tab");

    if (requestedTab === "saved") {
      setActiveTab("saved");
      return;
    }

    setActiveTab("decks");
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      if (!profile_slug) {
        setLoading(false);
        setError("Profile not found.");
        return;
      }

      const cacheKey = getProfileCacheKey(profile_slug);
      let hasCachedData = false;

      try {
        setError("");

        try {
          const cached = sessionStorage.getItem(cacheKey);

          if (cached) {
            const parsed = JSON.parse(cached);
            const cacheAge = Date.now() - Number(parsed?.timestamp || 0);

            const validCache =
              cacheAge < PROFILE_CACHE_DURATION &&
              parsed?.profile &&
              Array.isArray(parsed?.decks) &&
              Array.isArray(parsed?.userCards) &&
              Array.isArray(parsed?.allCards);

            if (validCache) {
              hasCachedData = true;

              setProfile(parsed.profile);
              setDecks(parsed.decks);
              setUserCards(parsed.userCards);
              setAllCards(parsed.allCards);
              setIsOwner(Boolean(parsed.isOwner));
              setIsSiteOwner(Boolean(parsed.isSiteOwner));
              setLoading(false);

              return;
            }
          }
        } catch (cacheError) {
          console.warn("Unable to read profile cache:", cacheError);
        }

        setLoading(true);

        const encodedSlug = encodeURIComponent(profile_slug);

        const [profileResponse, deckResponse, cardsResponse, allCardsResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/tbotapp/profile/${encodedSlug}/`, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              credentials: "include",
              signal: controller.signal,
            }),

            fetch(`${API_BASE_URL}/tbotapp/profile/${encodedSlug}/decks/`, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              credentials: "include",
              signal: controller.signal,
            }),

            fetch(`${API_BASE_URL}/tbotapp/profile/${encodedSlug}/cards/`, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              credentials: "include",
              signal: controller.signal,
            }),

            fetch(`${API_BASE_URL}/tbotapp/cardinfo/`, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              signal: controller.signal,
            }),
          ]);

        const profileData = await profileResponse.json().catch(() => null);

        if (!profileResponse.ok) {
          throw new Error(profileData?.error || "Unable to load profile.");
        }

        const loadedProfile = profileData?.profile || null;

        if (!loadedProfile) {
          throw new Error("Profile data was not returned.");
        }

        const deckData = await deckResponse.json().catch(() => null);

        if (!deckResponse.ok) {
          throw new Error(
            deckData?.error || "Unable to load this user's decklists.",
          );
        }

        const loadedDecks = Array.isArray(deckData?.decks)
          ? deckData.decks
          : [];

        const cardsData = await cardsResponse.json().catch(() => null);

        const loadedUserCards = cardsResponse.ok
          ? Array.isArray(cardsData)
            ? cardsData
            : Array.isArray(cardsData?.cards)
              ? cardsData.cards
              : []
          : [];

        const allCardsData = await allCardsResponse.json().catch(() => null);

        const loadedAllCards = allCardsResponse.ok
          ? Array.isArray(allCardsData)
            ? allCardsData
            : Array.isArray(allCardsData?.results)
              ? allCardsData.results
              : []
          : [];

        const loadedIsOwner = Boolean(profileData?.is_owner);
        const loadedIsSiteOwner = Boolean(profileData?.is_site_owner);

        setProfile(loadedProfile);
        setDecks(loadedDecks);
        setUserCards(loadedUserCards);
        setAllCards(loadedAllCards);
        setIsOwner(loadedIsOwner);
        setIsSiteOwner(loadedIsSiteOwner);

        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              profile: loadedProfile,
              isOwner: loadedIsOwner,
              isSiteOwner: loadedIsSiteOwner,
              decks: loadedDecks,
              userCards: loadedUserCards,
              allCards: loadedAllCards,
            }),
          );
        } catch (cacheError) {
          console.warn("Unable to save profile cache:", cacheError);
        }

        if (!controller.signal.aborted) {
          setLoading(false);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load profile:", err);

        if (!hasCachedData) {
          setProfile(null);
          setDecks([]);
          setUserCards([]);
          setAllCards([]);
          setSavedDecks([]);
          setIsOwner(false);
          setIsSiteOwner(false);
          setError(err.message || "Unable to load profile.");
        }

        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      controller.abort();
    };
  }, [profile_slug]);

  const handleRemoveSavedDeck = (removedDeck) => {
    const removedId = removedDeck.id || removedDeck.source_deck_id;
    const removedSourceType = removedDeck.source_type || "decklist";

    setSavedDecks((current) =>
      current.filter((deck) => {
        const deckId = deck.id || deck.source_deck_id;
        const deckSourceType = deck.source_type || "decklist";

        return !(
          String(deckId) === String(removedId) &&
          deckSourceType === removedSourceType
        );
      }),
    );
  };

  useEffect(() => {
    if (!isAuthenticated || !isOwner) {
      setSavedDecks([]);
      return;
    }

    const controller = new AbortController();

    const loadSavedDecks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/saved-decks/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.detail || data?.error || "Unable to load saved decks.",
          );
        }

        const loadedSavedDecks = Array.isArray(data)
          ? data
          : Array.isArray(data?.saved_decks)
            ? data.saved_decks
            : [];

        setSavedDecks(loadedSavedDecks);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load saved decks:", err);
        setSavedDecks([]);
      }
    };

    loadSavedDecks();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, isOwner]);

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

      try {
        const cacheKey = getProfileCacheKey(newSlug || profile_slug);
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          const parsed = JSON.parse(cached);

          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              ...parsed,
              timestamp: Date.now(),
              profile: updatedProfile,
            }),
          );
        }
      } catch (cacheError) {
        console.warn("Unable to update profile cache:", cacheError);
      }
    } catch (err) {
      console.error("Unable to update profile:", err);
      setEditError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>
            Loading profile
            <span className="loading-dots">
              <span />
              <span />
              <span />
            </span>
          </h2>

          <p>Preparing this user's profile and available content.</p>

          <div className="loading-status">
            <span>Loading profile data</span>
            <strong>Preparing...</strong>
          </div>
        </div>
      </div>
    );
  }

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

  const canonicalSlug = normalizeText(profile.profile_slug) || profile_slug;

  return (
    <div className="profile-page-wrapper">
      <Seo
        title={`${profileName} - PVZ Heroes Player Profile | Tbot`}
        description={`View ${profileName}'s Plants vs. Zombies Heroes player profile on Tbot. Explore their profile, card collection, and PVZ Heroes decklists.`}
        canonical={`/profile/${encodeURIComponent(canonicalSlug)}`}
        noindex={!profile.is_public}
      />

      <Navbar />

      <main className="profile-page">
        <ProfileHeader
          profile={profile}
          profileName={profileName}
          isOwner={isOwner}
          onShare={handleShareProfile}
          onEdit={openEditProfile}
        />

        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleProfileTabChange}
          showSavedDecks={isOwner && isAuthenticated}
        />

        <div className="profile-tab-content">
          {activeTab === "cards" && (
            <ProfileCardBrowser
              cards={userCards}
              allCards={allCards}
              profileName={profileName}
            />
          )}

          {activeTab === "decks" && (
            <ProfileDeckBrowser
              decks={decks}
              allCards={allCards}
              userCards={userCards}
              profileName={profile.display_name}
              viewerCards={viewerCards}
              profileSlug={profile_slug}
              profileIsPublic={Boolean(profile.is_public)}
              sharedDeckKey={
                activeTab === "decks" ? searchParams.get("deck") || "" : ""
              }
              isAuthenticated={isAuthenticated}
            />
          )}

          {activeTab === "saved" && isOwner && isAuthenticated && (
            <ProfileSavedDecks
              savedDecks={savedDecks}
              allCards={allCards}
              viewerCards={viewerCards}
              profileSlug={profile_slug}
              profileIsPublic={Boolean(profile.is_public)}
              isAuthenticated={isAuthenticated}
              onRemoveSaved={handleRemoveSavedDeck}
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
