import { useEffect, useMemo, useState } from "react";

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

const STORAGE_KEYS = {
  profiles: "tbot_public_profiles",
  userCount: "tbot_public_user_count",
};

const normalizeText = (value) => String(value ?? "").trim();

const readSessionCache = (key, fallback) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.sessionStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.warn(`Unable to read session cache "${key}":`, error);
    return fallback;
  }
};

const writeSessionCache = (key, value) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to write session cache "${key}":`, error);
  }
};

const getDiscordAvatarUrl = (profile) => {
  const avatar = normalizeText(profile?.avatar);
  const discordId = normalizeText(profile?.discord_id);

  if (!avatar) {
    if (discordId) {
      try {
        const numericId = BigInt(discordId);
        const defaultAvatarIndex = Number((numericId >> 22n) % 6n);

        return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
      } catch {
        return "";
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
    const extension = avatar.startsWith("a_") ? "gif" : "png";

    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
  }

  return "";
};

function Users() {
  const initialProfiles = readSessionCache(STORAGE_KEYS.profiles, []);
  const initialUserCount = readSessionCache(STORAGE_KEYS.userCount, null);

  const hasCachedProfiles =
    Array.isArray(initialProfiles) && initialProfiles.length > 0;

  const [profiles, setProfiles] = useState(
    Array.isArray(initialProfiles) ? initialProfiles : [],
  );

  const [totalUsers, setTotalUsers] = useState(
    Number.isFinite(Number(initialUserCount)) ? Number(initialUserCount) : null,
  );

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!hasCachedProfiles);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Users";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUserCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/profiles/count/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `User count request failed with status ${response.status}`,
          );
        }

        const data = await response.json();
        const count = Number(data?.count);

        if (Number.isFinite(count) && count >= 0) {
          setTotalUsers(count);
          writeSessionCache(STORAGE_KEYS.userCount, count);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to refresh public user count:", err);
        }
      }
    };

    fetchUserCount();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfiles = async () => {
      try {
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
        setError("");

        writeSessionCache(STORAGE_KEYS.profiles, results);

        if (totalUsers === null || totalUsers === 0) {
          setTotalUsers(results.length);
          writeSessionCache(STORAGE_KEYS.userCount, results.length);
        }

        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load public profiles:", err);

        if (hasCachedProfiles) {
          setError("");
          setLoading(false);
          return;
        }

        setError(err.message || "Unable to load users right now.");
        setLoading(false);
      }
    };

    loadProfiles();

    return () => {
      controller.abort();
    };
  }, []);

  const sortedProfiles = useMemo(() => {
    const getAlphabeticalKey = (profile) => {
      const name =
        normalizeText(profile.display_name) ||
        normalizeText(profile.username) ||
        normalizeText(profile.profile_slug) ||
        "";

      return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
    };

    return [...profiles].sort((a, b) => {
      const aKey = getAlphabeticalKey(a);
      const bKey = getAlphabeticalKey(b);

      if (aKey < bKey) {
        return -1;
      }

      if (aKey > bKey) {
        return 1;
      }

      return 0;
    });
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return sortedProfiles;
    }

    return sortedProfiles.filter((profile) => {
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
  }, [sortedProfiles, search]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading users</h2>

          <p>Finding public Tbot profiles.</p>

          <div className="loading-status">
            <span>Loading user data</span>

            <strong>
              {totalUsers !== null
                ? `${totalUsers} public users`
                : "Loading..."}
            </strong>
          </div>
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
            <strong>
              {totalUsers !== null ? totalUsers : profiles.length}
            </strong>{" "}
            public users
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

              const profileUrl = profileSlug
                ? `/profile/${encodeURIComponent(profileSlug)}`
                : null;

              const cardContent = (
                <>
                  <div className="user-card-top">
                    <div className="user-avatar">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={`${displayName} avatar`}
                          onError={(event) => {
                            const discordId = normalizeText(profile.discord_id);

                            if (discordId) {
                              try {
                                const numericId = BigInt(discordId);

                                const defaultAvatarIndex = Number(
                                  (numericId >> 22n) % 6n,
                                );

                                const fallbackUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;

                                if (event.currentTarget.src !== fallbackUrl) {
                                  event.currentTarget.src = fallbackUrl;
                                  return;
                                }
                              } catch {}
                            }

                            event.currentTarget.style.display = "none";

                            const parent = event.currentTarget.parentElement;

                            if (parent) {
                              parent.classList.add("user-avatar-fallback");
                              parent.textContent = displayName
                                .charAt(0)
                                .toUpperCase();
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
                </>
              );

              return profileUrl ? (
                <Link
                  key={profile.id || profile.profile_slug || profile.username}
                  to={profileUrl}
                  className="user-card user-card-link"
                  aria-label={`View ${displayName}'s profile`}
                >
                  {cardContent}
                </Link>
              ) : (
                <article
                  className="user-card"
                  key={profile.id || profile.profile_slug || profile.username}
                >
                  {cardContent}
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
