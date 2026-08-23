import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

import "../css/profile.css";

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

function Profile() {
  const { profile_slug } = useParams();

  const [profile, setProfile] = useState(null);

  // We only use this to determine the number of decks.
  const [deckCount, setDeckCount] = useState(0);

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

  const loadProfile = async (slug = profile_slug) => {
    if (!slug) {
      setLoading(false);
      setError("Profile not found.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * First load the profile itself.
       */
      let profileResponse;

      try {
        profileResponse = await fetch(
          `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(slug)}/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
          },
        );
      } catch (fetchError) {
        console.error("Profile request failed:", fetchError);

        throw new Error(
          `Unable to connect to the API at ${API_BASE_URL || "the configured API"}. ` +
            "Make sure Django is running.",
        );
      }

      let profileData = {};

      try {
        profileData = await profileResponse.json();
      } catch {
        profileData = {};
      }

      if (!profileResponse.ok) {
        throw new Error(profileData?.error || "Unable to load profile.");
      }

      const loadedProfile = profileData.profile || null;

      if (!loadedProfile) {
        throw new Error("Profile data was not returned.");
      }

      setProfile(loadedProfile);
      setIsOwner(Boolean(profileData.is_owner));
      setIsSiteOwner(Boolean(profileData.is_site_owner));

      /*
       * The profile detail endpoint does not return the user's decks.
       *
       * The separate endpoint is:
       *
       * /tbotapp/profile/<profile_slug>/decks/
       *
       * We only need the number of returned decks.
       */
      try {
        const deckResponse = await fetch(
          `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(slug)}/decks/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
          },
        );

        let deckData = {};

        try {
          deckData = await deckResponse.json();
        } catch {
          deckData = {};
        }

        if (!deckResponse.ok) {
          console.error("Unable to load profile decks:", deckData);

          /*
           * Don't make the entire profile fail just because
           * the deck count endpoint failed.
           */
          setDeckCount(0);
        } else {
          const returnedDecks = Array.isArray(deckData.decks)
            ? deckData.decks
            : [];

          setDeckCount(returnedDecks.length);
        }
      } catch (deckError) {
        console.error("Unable to load profile decks:", deckError);

        setDeckCount(0);
      }
    } catch (err) {
      console.error("Unable to load profile:", err);

      setProfile(null);
      setDeckCount(0);
      setIsOwner(false);
      setIsSiteOwner(false);

      setError(err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
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

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update profile.");
      }

      const updatedProfile = data.profile;

      if (!updatedProfile) {
        throw new Error(
          "Profile was updated, but no profile data was returned.",
        );
      }

      setProfile(updatedProfile);

      setEditOpen(false);
      setEditError("");

      const newSlug = updatedProfile.profile_slug;

      if (newSlug && newSlug !== profile_slug) {
        window.history.replaceState(
          {},
          "",
          `/profile/${encodeURIComponent(newSlug)}`,
        );
        await loadProfile(newSlug);
      }
    } catch (err) {
      console.error("Unable to update profile:", err);

      setEditError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = async () => {
    const currentSlug = profile?.profile_slug || profile_slug;

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
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-loading">Loading profile...</div>
        </main>

        <Footer />
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
  const avatarUrl = profile.avatar
    ? `https://cdn.discordapp.com/avatars/${profile.discord_id}/${profile.avatar}.${
        String(profile.avatar).startsWith("a_") ? "gif" : "png"
      }?size=256`
    : null;
  const decklistsPath = `/profile/${encodeURIComponent(
    profile.profile_slug,
  )}/decklists`;

  return (
    <div>
      <Navbar />

      <main className="profile-page">
        <section className="profile-header">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${profile.display_name} avatar`} />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1>{profile.display_name}</h1>

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

        <section className="profile-decks">
          <div className="profile-decks-header">
            <h2 style={{ marginTop: "10px" }}>Decklists</h2>

            <div
              className="profile-decks-header-actions"
              style={{ marginTop: "10px" }}
            >
              <Link to={decklistsPath} className="profile-decklists-button">
                View Decklists
              </Link>
            </div>
          </div>

          <div className="profile-no-decks">
            {deckCount === 0
              ? "0 decklists"
              : `${deckCount} ${deckCount === 1 ? "decklist" : "decklists"}`}
          </div>
        </section>

        {isSiteOwner && (
          <div style={{ display: "none" }}>
            Site owner profile access enabled.
          </div>
        )}
      </main>

      {shareMessage && (
        <div className="profile-share-message">{shareMessage}</div>
      )}

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
