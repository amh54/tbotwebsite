import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  const [decks, setDecks] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isSiteOwner, setIsSiteOwner] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/profile/${encodeURIComponent(
            profile_slug,
          )}/`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load profile.");
        }

        if (!cancelled) {
          setProfile(data.profile || null);
          setDecks(Array.isArray(data.decks) ? data.decks : []);
          setIsOwner(Boolean(data.is_owner));
          setIsSiteOwner(Boolean(data.is_site_owner));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Unable to load profile:", err);

          setProfile(null);
          setDecks([]);
          setIsOwner(false);
          setIsSiteOwner(false);

          setError(err.message || "Unable to load profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (profile_slug) {
      loadProfile();
    } else {
      setLoading(false);
      setError("Profile not found.");
    }

    return () => {
      cancelled = true;
    };
  }, [profile_slug]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-loading">Loading profile...</div>
        </main>

        <Footer credits="Special thanks to the many pvzh community members who took time out of their day to give me helpful feedback and critiques before publishing this site" />
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-error">{error}</div>
        </main>

        <Footer credits="Special thanks to the many pvzh community members who took time out of their day to give me helpful feedback and critiques before publishing this site" />
      </div>
    );
  }

  // ============================================================
  // NO PROFILE
  // ============================================================

  if (!profile) {
    return (
      <div>
        <Navbar />

        <main className="profile-page">
          <div className="profile-error">Profile not found.</div>
        </main>

        <Footer credits="Special thanks to the many pvzh community members who took time out of their day to give me helpful feedback and critiques before publishing this site" />
      </div>
    );
  }

  // ============================================================
  // DISCORD AVATAR
  // ============================================================

  const avatarUrl = profile.avatar
    ? `https://cdn.discordapp.com/avatars/${profile.discord_id}/${profile.avatar}.png?size=256`
    : null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
      <Navbar />

      <main className="profile-page">
        {/* ====================================================== */}
        {/* PROFILE HEADER */}
        {/* ====================================================== */}

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

            <div className="profile-username">@{profile.username}</div>

            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-meta">
              {profile.is_public ? "Public profile" : "Private profile"}
            </div>
          </div>

          {isOwner && (
            <button type="button" className="profile-edit-button">
              Edit Profile
            </button>
          )}
        </section>

        {/* ====================================================== */}
        {/* DECKLISTS */}
        {/* ====================================================== */}

        <section className="profile-decks">
          <div className="profile-decks-header">
            <h2>Decklists</h2>

            {isOwner && (
              <button type="button" className="profile-create-deck-button">
                Create Deck
              </button>
            )}
          </div>

          {decks.length === 0 ? (
            <div className="profile-no-decks">No decklists yet.</div>
          ) : (
            <div className="profile-deck-grid">
              {decks.map((deck) => (
                <article key={deck.id} className="profile-deck-card">
                  {deck.image && (
                    <img
                      src={deck.image}
                      alt={deck.name}
                      className="profile-deck-image"
                    />
                  )}

                  <div className="profile-deck-content">
                    <h3>{deck.name}</h3>

                    {deck.hero && <p>{deck.hero}</p>}

                    {deck.archetype && <p>{deck.archetype}</p>}

                    {deck.category && <p>{deck.category}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ====================================================== */}
        {/* SITE OWNER */}
        {/* ====================================================== */}

        {isSiteOwner && (
          <div style={{ display: "none" }}>
            Site owner profile access enabled.
          </div>
        )}
      </main>

      <Footer credits="Special thanks to the many pvzh community members who took time out of their day to give me helpful feedback and critiques before publishing this site" />
    </div>
  );
}

export default Profile;
