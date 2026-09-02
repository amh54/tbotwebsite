import { useEffect, useState } from "react";

import { useParams, useSearchParams } from "react-router-dom";

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

const PROFILE_CACHE_DURATION = 30 * 60 * 1000;

const normalizeText = (value) => String(value ?? "").trim();

const normalizeKey = (value) => normalizeText(value).toLowerCase();

const getProfileCacheKey = (slug) => `tbot_profile_cache_${normalizeKey(slug)}`;

function Profile() {
  const { profile_slug } = useParams();

  const [searchParams] = useSearchParams();

  const [userCards, setUserCards] = useState([]);
  const [viewerCards, setViewerCards] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [profile, setProfile] = useState(null);

  const [decks, setDecks] = useState([]);

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

    const loadViewer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/profile/me/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.authenticated) {
          setIsAuthenticated(false);
          setViewerCards([]);
          return;
        }

        setIsAuthenticated(true);

        const cardsResponse = await fetch(
          `${API_BASE_URL}/tbotapp/profile/me/cards/`,
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

        const loadedViewerCards = cardsResponse.ok
          ? Array.isArray(cardsData)
            ? cardsData
            : Array.isArray(cardsData?.cards)
              ? cardsData.cards
              : []
          : [];

        setViewerCards(loadedViewerCards);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load viewer:", err);
          setIsAuthenticated(false);
          setViewerCards([]);
        }
      }
    };

    loadViewer();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Load profile
   * --------------------------------------------------------------------------
   */
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

        /*
         * --------------------------------------------------------------
         * Load cached profile first
         * --------------------------------------------------------------
         */
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

        /*
         * --------------------------------------------------------------
         * First load / expired cache
         * --------------------------------------------------------------
         */
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

        /*
         * --------------------------------------------------------------
         * Profile
         * --------------------------------------------------------------
         */
        const profileData = await profileResponse.json().catch(() => null);

        if (!profileResponse.ok) {
          throw new Error(profileData?.error || "Unable to load profile.");
        }

        const loadedProfile = profileData?.profile || null;

        if (!loadedProfile) {
          throw new Error("Profile data was not returned.");
        }

        /*
         * --------------------------------------------------------------
         * Decks
         * --------------------------------------------------------------
         */
        const deckData = await deckResponse.json().catch(() => null);

        if (!deckResponse.ok) {
          throw new Error(
            deckData?.error || "Unable to load this user's decklists.",
          );
        }

        const loadedDecks = Array.isArray(deckData?.decks)
          ? deckData.decks
          : [];

        /*
         * --------------------------------------------------------------
         * User cards
         * --------------------------------------------------------------
         */
        const cardsData = await cardsResponse.json().catch(() => null);

        const loadedUserCards = cardsResponse.ok
          ? Array.isArray(cardsData)
            ? cardsData
            : Array.isArray(cardsData?.cards)
              ? cardsData.cards
              : []
          : [];

        /*
         * --------------------------------------------------------------
         * All cards
         * --------------------------------------------------------------
         */
        const allCardsData = await allCardsResponse.json().catch(() => null);

        const loadedAllCards = allCardsResponse.ok
          ? Array.isArray(allCardsData)
            ? allCardsData
            : Array.isArray(allCardsData?.results)
              ? allCardsData.results
              : []
          : [];

        /*
         * --------------------------------------------------------------
         * Update state
         * --------------------------------------------------------------
         */
        const loadedIsOwner = Boolean(profileData?.is_owner);

        const loadedIsSiteOwner = Boolean(profileData?.is_site_owner);

        setProfile(loadedProfile);

        setDecks(loadedDecks);

        setUserCards(loadedUserCards);

        setAllCards(loadedAllCards);

        setIsOwner(loadedIsOwner);

        setIsSiteOwner(loadedIsSiteOwner);

        /*
         * --------------------------------------------------------------
         * Save everything to session cache
         * --------------------------------------------------------------
         */
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

        /*
         * If cached data was already displayed,
         * don't destroy it because the refresh failed.
         */
        if (!hasCachedData) {
          setProfile(null);

          setDecks([]);

          setUserCards([]);

          setAllCards([]);

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

  /*
   * --------------------------------------------------------------------------
   * Handle shared deck links
   * --------------------------------------------------------------------------
   */
  useEffect(() => {
    if (searchParams.has("deck")) {
      setActiveTab("decks");
    }
  }, [searchParams]);

  /*
   * --------------------------------------------------------------------------
   * Edit profile
   * --------------------------------------------------------------------------
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

      /*
       * Update the current browser URL if the slug changed.
       */
      const newSlug = normalizeText(updatedProfile.profile_slug);

      if (newSlug && newSlug !== profile_slug) {
        window.history.replaceState(
          {},
          "",
          `/profile/${encodeURIComponent(newSlug)}`,
        );
      }

      /*
       * Update cached profile.
       */
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

  /*
   * --------------------------------------------------------------------------
   * Share profile
   * --------------------------------------------------------------------------
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
   * --------------------------------------------------------------------------
   * Loading
   * --------------------------------------------------------------------------
   */
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

  /*
   * --------------------------------------------------------------------------
   * Error
   * --------------------------------------------------------------------------
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

  /*
   * --------------------------------------------------------------------------
   * Missing profile
   * --------------------------------------------------------------------------
   */
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

  /*
   * --------------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------------
   */
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
              allCards={allCards}
              userCards={userCards}
              viewerCards={viewerCards}
              profileSlug={profile_slug}
              profileIsPublic={Boolean(profile.is_public)}
              sharedDeckKey={searchParams.get("deck") || ""}
              isAuthenticated={isAuthenticated}
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
