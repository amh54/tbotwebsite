import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/navbar";

import Footer from "../components/footer";

import "../css/users.css";

import "../css/navbar.css";

import "../css/loading.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

const normalizeText = (value) => String(value ?? "").trim();

const getDiscordAvatarUrl = (profile) => {
  const avatar = normalizeText(profile?.avatar);
  const discordId = normalizeText(profile?.discord_id);

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

  if (discordId) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=256`;
  }

  return "";
};

function Users() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Users";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/tbotapp/profiles/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Request failed with status ${response.status}`;

          try {
            const payload = await response.json();

            if (payload?.detail) {
              message += `: ${payload.detail}`;
            } else if (payload?.error) {
              message += `: ${payload.error}`;
            }
          } catch {}

          throw new Error(message);
        }

        const data = await response.json();

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.profiles)
            ? data.profiles
            : Array.isArray(data?.results)
              ? data.results
              : [];

        setProfiles(results);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load public profiles:", err);

        setError(err.message || "Unable to load users right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProfiles();

    return () => controller.abort();
  }, []);

  const filteredProfiles = profiles.filter((profile) => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    const displayName = normalizeText(profile.display_name).toLowerCase();

    const username = normalizeText(profile.username).toLowerCase();

    const profileSlug = normalizeText(profile.profile_slug).toLowerCase();

    const bio = normalizeText(profile.bio).toLowerCase();

    return (
      displayName.includes(searchValue) ||
      username.includes(searchValue) ||
      profileSlug.includes(searchValue) ||
      bio.includes(searchValue)
    );
  });

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading users</h2>

          <p>Finding public Tbot profiles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <Navbar />

      <main className="users-content">
        <div className="users-header">
          <div>
            <h1>Users</h1>

            <p>Browse public Tbot profiles and explore their decklists.</p>
          </div>
        </div>

        <div className="users-search-container">
          <input
            type="search"
            className="users-search"
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="users-results-bar">
          <p>
            Showing <strong>{filteredProfiles.length}</strong> of{" "}
            <strong>{profiles.length}</strong> public users
          </p>
        </div>

        {error ? (
          <div className="users-error">
            <h2>Unable to load users</h2>

            <p>{error}</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="users-empty">
            <h2>
              {profiles.length === 0 ? "No public users yet" : "No users found"}
            </h2>

            <p>
              {profiles.length === 0
                ? "There are currently no public profiles to browse."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredProfiles.map((profile) => {
              const displayName =
                normalizeText(profile.display_name) ||
                normalizeText(profile.username) ||
                normalizeText(profile.profile_slug) ||
                "Tbot User";

              const username = normalizeText(profile.username);

              const profileSlug = normalizeText(profile.profile_slug);

              const bio = normalizeText(profile.bio);

              const avatar = getDiscordAvatarUrl(profile);

              return (
                <article className="user-card" key={profile.id}>
                  <div className="user-card-top">
                    <div className="user-avatar">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={`${displayName} avatar`}
                          onError={(event) => {
                            const discordId = normalizeText(profile.discord_id);

                            if (
                              discordId &&
                              event.currentTarget.src !==
                                `https://cdn.discordapp.com/embed/avatars/${(Number(discordId) >> 22) % 6}.png`
                            ) {
                              const defaultAvatarIndex =
                                (Number(discordId) >> 22) % 6;

                              event.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
                            } else {
                              event.currentTarget.style.display = "none";

                              const parent = event.currentTarget.parentElement;

                              if (parent) {
                                parent.classList.add("user-avatar-fallback");

                                parent.textContent = displayName
                                  .charAt(0)
                                  .toUpperCase();
                              }
                            }
                          }}
                        />
                      ) : (
                        <span>{displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="user-card-info">
                      <h2>{displayName}</h2>

                      {username ? (
                        <p className="user-card-username">@{username}</p>
                      ) : profileSlug ? (
                        <p className="user-card-slug">@{profileSlug}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="user-card-body">
                    {bio ? (
                      <p className="user-card-bio">{bio}</p>
                    ) : (
                      <p className="user-card-bio user-card-no-bio">
                        No bio provided.
                      </p>
                    )}
                  </div>

                  <div className="user-card-actions">
                    {profileSlug ? (
                      <>
                        <Link
                          to={`/profile/${encodeURIComponent(profileSlug)}`}
                          className="user-profile-button"
                        >
                          View Profile
                        </Link>

                        <Link
                          to={`/users/${encodeURIComponent(
                            profileSlug,
                          )}/decklists`}
                          className="user-decklists-button"
                        >
                          View Decklists
                        </Link>
                      </>
                    ) : (
                      <span className="user-card-unavailable">
                        Profile link unavailable
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer credits="Browse public Tbot profiles and explore their decklists." />
    </div>
  );
}

export default Users;
