import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/navbar";

import Footer from "../components/footer";

import Seo from "../components/seo.jsx";

import "../css/users.css";

import "../css/navbar.css";

import "../css/loading.css";

import { API_BASE_URL } from "../utils/api.js";

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

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="user-social-icon">
    <path
      d="M23 12s0-4-1-5-2-1-4-1H6C4 6 3 6 2 7s-1 5-1 5 0 4 1 5 2 1 4 1h12c2 0 3 0 4-1s1-5 1-5Z"
      fill="currentColor"
    />
    <path d="m10 9 5 3-5 3V9Z" fill="#101416" />
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="user-social-icon">
    <path
      d="M4 2h17v12l-5 5h-4l-3 3v-3H4V2Zm3 3v10h3v3l3-3h4l2-2V5H7Zm3 2h2v5h-2V7Zm5 0h2v5h-2V7Z"
      fill="currentColor"
    />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="user-social-icon">
    <path
      d="M15 3c.3 2 1.4 3.5 3.5 4.1V10c-1.4-.1-2.7-.6-3.5-1.4v6.2a5.2 5.2 0 1 1-4.5-5.1v2.9a2.3 2.3 0 1 0 1.6 2.2V3H15Z"
      fill="currentColor"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="user-social-icon">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />

    <circle
      cx="12"
      cy="12"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />

    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="user-social-icon">
    <path
      d="M18.9 2H22l-6.8 7.8L23.2 22h-6.2l-4.9-6.4L6.5 22H3.4l7.3-8.4L2.8 2H9l4.4 5.8L18.9 2Zm-1.1 17.7h1.7L8.3 4.2H6.5l11.3 15.5Z"
      fill="currentColor"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="user-social-icon">
    <path
      d="M19.5 5.2A16.7 16.7 0 0 0 15.3 4l-.5 1a15 15 0 0 0-5.6 0l-.5-1a16.7 16.7 0 0 0-4.2 1.2C1.8 9.1 1.1 13 1.4 16.9a16.9 16.9 0 0 0 5.2 2.6l1.3-1.8c-.7-.3-1.3-.7-1.9-1.1l.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4c-.6.4-1.2.8-1.9 1.1l1.3 1.8a16.9 16.9 0 0 0 5.2-2.6c.4-4.5-.8-8.4-3.5-11.7ZM8.5 14.1c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm7 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z"
      fill="currentColor"
    />
  </svg>
);

const socialConnections = [
  {
    key: "youtube_url",
    label: "YouTube",
    searchTerms: ["youtube"],
    Icon: YouTubeIcon,
    contentCreator: true,
  },
  {
    key: "twitch_url",
    label: "Twitch",
    searchTerms: ["twitch"],
    Icon: TwitchIcon,
    contentCreator: true,
  },
  {
    key: "tiktok_url",
    label: "TikTok",
    searchTerms: ["tiktok", "tik tok"],
    Icon: TikTokIcon,
    contentCreator: true,
  },
  {
    key: "instagram_url",
    label: "Instagram",
    searchTerms: ["instagram", "insta"],
    Icon: InstagramIcon,
    contentCreator: false,
  },
  {
    key: "twitter_url",
    label: "Twitter/X",
    searchTerms: ["twitter", "twitter/x", "x"],
    Icon: TwitterIcon,
    contentCreator: false,
  },
  {
    key: "discord_server_url",
    label: "Discord",
    searchTerms: ["discord", "discord server"],
    Icon: DiscordIcon,
    contentCreator: false,
  },
];

const getSocialSearchConnection = (value) => {
  const searchValue = normalizeText(value).toLowerCase();

  if (!searchValue) {
    return null;
  }

  if (
    searchValue === "content creator" ||
    searchValue === "content creators" ||
    searchValue === "creator" ||
    searchValue === "creators"
  ) {
    return {
      contentCreator: true,
    };
  }

  return (
    socialConnections.find(({ searchTerms }) =>
      searchTerms.some(
        (term) => searchValue === term || searchValue.includes(term),
      ),
    ) || null
  );
};
function Users() {
  const [profileSlug, setProfileSlug] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/profile/me/`, {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled && data?.profile_exists && data?.profile?.profile_slug) {
          setProfileSlug(data.profile.profile_slug);
        }
      } catch {}
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

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

    const socialSearch = getSocialSearchConnection(searchValue);

    if (socialSearch) {
      if (socialSearch.contentCreator) {
        return sortedProfiles.filter((profile) =>
          socialConnections.some(
            ({ key, contentCreator }) =>
              contentCreator && normalizeText(profile[key]),
          ),
        );
      }

      return sortedProfiles.filter((profile) =>
        normalizeText(profile[socialSearch.key]),
      );
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
      <Seo
        title="PVZH Players & Community Profiles - PVZ Heroes | Tbot"
        description="Browse public Plants vs. Zombies Heroes player profiles on Tbot. Discover the PVZH community, player profiles, bios, social connections, and shared PVZ Heroes decklists."
        canonical="/users"
      />

      <Navbar />

      <main className="users-content">
        <div className="users-header">
          <div>
            <h1>PVZ Heroes Players & Community Profiles</h1>

            <p>
              Browse public Plants vs. Zombies Heroes player profiles and
              explore their decklists.
            </p>
          </div>
        </div>

        <div className="users-search-container">
          <input
            type="search"
            className="users-search"
            placeholder="Search users or connections..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="users-results-bar">
          <p>
            All Profiles shown below come from only public accounts. If you want
            your profile to show up here, please edit your profile from private
            to public under{" "}
            <Link to={`/profile/${encodeURIComponent(profileSlug)}`}>
              Your Profile
            </Link>{" "}
            <br />
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
                : "Try a different search or connection."}
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

              const availableSocialConnections = socialConnections.filter(
                ({ key }) => normalizeText(profile[key]),
              );

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

                    {availableSocialConnections.length > 0 && (
                      <div className="user-social-links">
                        {availableSocialConnections.map(
                          ({ key, label, Icon }) => (
                            <a
                              key={key}
                              href={normalizeText(profile[key])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="user-social-link"
                              aria-label={`${label} for ${displayName}`}
                              title={label}
                              onClick={(event) => {
                                event.stopPropagation();
                              }}
                            >
                              <Icon />
                            </a>
                          ),
                        )}
                      </div>
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
