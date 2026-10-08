import { useEffect, useMemo, useState } from "react";

import ReactMarkdown from "react-markdown";

import { Link } from "react-router-dom";

import Navbar from "../../components/navbar.jsx";

import Footer from "../../components/footer.jsx";

import "../../css/users.css";

import "../../css/navbar.css";

import "../../css/loading.css";

import { API_BASE_URL } from "../../utils/api.js";

import Seo from "../../components/seo.jsx";

const DECKBUILDERS_CACHE_KEY = "tbot_deckbuilders_cache";

const DECKBUILDERS_COUNT_CACHE_KEY = "tbot_deckbuilders_count_cache";

const normalizeText = (value) => String(value ?? "").trim();

const getDeckCount = (deckbuilder) => {
  const actualDeckCount = Number(deckbuilder?.actual_deck_count);

  if (Number.isFinite(actualDeckCount)) {
    return actualDeckCount;
  }

  const deckCount = Number(deckbuilder?.deck_count);

  if (Number.isFinite(deckCount)) {
    return deckCount;
  }

  const legacyDeckCount = Number(deckbuilder?.numb_of_decks);

  if (Number.isFinite(legacyDeckCount)) {
    return legacyDeckCount;
  }

  return 0;
};

const getDiscordAvatarUrl = (profile) => {
  const avatar = normalizeText(profile?.avatar);
  const discordId = normalizeText(profile?.discord_id);

  if (!avatar) {
    if (discordId) {
      const numericId = Number(discordId);

      if (Number.isSafeInteger(numericId) && numericId >= 0) {
        const defaultAvatarIndex = Math.floor(numericId / 4194304) % 6;

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
    const extension = avatar.startsWith("a_") ? "gif" : "png";

    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
  }

  return "";
};

const readCache = (key) => {
  try {
    const cached = sessionStorage.getItem(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.warn(`Unable to read ${key} from sessionStorage:`, error);
    return null;
  }
};

const writeCache = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to write ${key} to sessionStorage:`, error);
  }
};

const YouTubeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="user-social-icon"
  >
    <path
      d="M23 12s0-4-1-5-2-1-4-1H6C4 6 3 6 2 7s-1 5-1 5 0 4 1 5 2 1 4 1h12c2 0 3 0 4-1s1-5 1-5Z"
      fill="currentColor"
    />
    <path d="m10 9 5 3-5 3V9Z" fill="#101416" />
  </svg>
);

const TwitchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="user-social-icon"
  >
    <path
      d="M4 2h17v12l-5 5h-4l-3 3v-3H4V2Zm3 3v10h3v3l3-3h4l2-2V5H7Zm3 2h2v5h-2V7Zm5 0h2v5h-2V7Z"
      fill="currentColor"
    />
  </svg>
);

const TikTokIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="user-social-icon"
  >
    <path
      d="M15 3c.3 2 1.4 3.5 3.5 4.1V10c-1.4-.1-2.7-.6-3.5-1.4v6.2a5.2 5.2 0 1 1-4.5-5.1v2.9a2.3 2.3 0 1 0 1.6 2.2V3H15Z"
      fill="currentColor"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="user-social-icon"
  >
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
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="user-social-icon"
  >
    <path
      d="M18.9 2H22l-6.8 7.8L23.2 22h-6.2l-4.9-6.4L6.5 22H3.4l7.3-8.4L2.8 2H9l4.4 5.8L18.9 2Zm-1.1 17.7h1.7L8.3 4.2H6.5l11.3 15.5Z"
      fill="currentColor"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="user-social-icon"
  >
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
    Icon: YouTubeIcon,
  },
  {
    key: "twitch_url",
    label: "Twitch",
    Icon: TwitchIcon,
  },
  {
    key: "tiktok_url",
    label: "TikTok",
    Icon: TikTokIcon,
  },
  {
    key: "instagram_url",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    key: "twitter_url",
    label: "Twitter/X",
    Icon: TwitterIcon,
  },
  {
    key: "discord_server_url",
    label: "Discord",
    Icon: DiscordIcon,
  },
];

function Deckbuilders() {
  const cachedDeckbuilders = readCache(DECKBUILDERS_CACHE_KEY);
  const cachedCount = readCache(DECKBUILDERS_COUNT_CACHE_KEY);

  const hasCachedDeckbuilders = Array.isArray(cachedDeckbuilders);
  const hasCachedCount = Number.isFinite(Number(cachedCount));

  const [deckbuilders, setDeckbuilders] = useState(
    hasCachedDeckbuilders ? cachedDeckbuilders : [],
  );

  const [totalDeckbuilders, setTotalDeckbuilders] = useState(
    hasCachedCount ? Number(cachedCount) : null,
  );

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!hasCachedDeckbuilders);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/deckbuilders/count/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const count = Number(data?.count);

        if (Number.isFinite(count)) {
          setTotalDeckbuilders(count);
          writeCache(DECKBUILDERS_COUNT_CACHE_KEY, count);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load deckbuilder count:", err);
        }
      }
    };

    fetchCount();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadDeckbuilders = async () => {
      try {
        if (!hasCachedDeckbuilders) {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/deckbuilders/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || `Request failed with status ${response.status}`,
          );
        }

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.deckbuilders)
            ? data.deckbuilders
            : Array.isArray(data?.results)
              ? data.results
              : [];

        setDeckbuilders(results);
        writeCache(DECKBUILDERS_CACHE_KEY, results);

        setTotalDeckbuilders((currentCount) => {
          if (currentCount !== null) {
            return currentCount;
          }

          writeCache(DECKBUILDERS_COUNT_CACHE_KEY, results.length);

          return results.length;
        });

        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load deckbuilders:", err);

        if (!hasCachedDeckbuilders) {
          setError(err.message || "Unable to load deckbuilders right now.");
          setLoading(false);
        }
      }
    };

    loadDeckbuilders();

    return () => {
      controller.abort();
    };
  }, [hasCachedDeckbuilders]);

  const sortedDeckbuilders = useMemo(() => {
    return [...deckbuilders].sort((a, b) => {
      const aDeckCount = getDeckCount(a);
      const bDeckCount = getDeckCount(b);

      if (aDeckCount !== bDeckCount) {
        return bDeckCount - aDeckCount;
      }

      const aName =
        normalizeText(a.display_name) ||
        normalizeText(a.deckbuilder_name) ||
        "";

      const bName =
        normalizeText(b.display_name) ||
        normalizeText(b.deckbuilder_name) ||
        "";

      return aName.localeCompare(bName, undefined, {
        sensitivity: "base",
      });
    });
  }, [deckbuilders]);

  const filteredDeckbuilders = useMemo(() => {
    const searchValue = normalizeText(search).toLowerCase();

    if (!searchValue) {
      return sortedDeckbuilders;
    }

    return sortedDeckbuilders.filter((deckbuilder) => {
      const name = normalizeText(deckbuilder.display_name).toLowerCase();
      const deckbuilderName = normalizeText(
        deckbuilder.deckbuilder_name,
      ).toLowerCase();
      const username = normalizeText(deckbuilder.username).toLowerCase();
      const bio = normalizeText(deckbuilder.bio).toLowerCase();

      return (
        name.includes(searchValue) ||
        deckbuilderName.includes(searchValue) ||
        username.includes(searchValue) ||
        bio.includes(searchValue)
      );
    });
  }, [sortedDeckbuilders, search]);

  if (loading && deckbuilders.length === 0) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading deckbuilders</h2>

          <p>Finding Tbot deckbuilders.</p>

          <div className="loading-status">
            <span>Loading deckbuilder data</span>

            <strong>
              {totalDeckbuilders !== null
                ? `${totalDeckbuilders} deckbuilders`
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
        title="PVZH Deck Builders - PVZ Heroes Deck Builders | Tbot"
        description="Browse PVZH deck builders on Tbot. Explore community deckbuilders and discover their Plants vs. Zombies Heroes decks."
        canonical="/deckbuilders"
      />

      <Navbar />

      <main className="users-content">
        <div className="users-header">
          <div>
            <h1>PVZ Heroes Deck Builders</h1>

            <p>Browse the people who have built decks for Tbot.</p>
          </div>
        </div>

        <div className="users-search-container">
          <input
            type="search"
            className="users-search"
            placeholder="Search deckbuilders..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="users-results-bar">
          <p>
            Showing <strong>{filteredDeckbuilders.length}</strong> of{" "}
            <strong>
              {totalDeckbuilders !== null
                ? totalDeckbuilders
                : deckbuilders.length}
            </strong>{" "}
            deckbuilders
          </p>
        </div>

        {error ? (
          <div className="users-error">
            <h2>Unable to load deckbuilders</h2>

            <p>{error}</p>
          </div>
        ) : filteredDeckbuilders.length === 0 ? (
          <div className="users-empty">
            <h2>No deckbuilders found</h2>

            <p>Try a different search.</p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredDeckbuilders.map((deckbuilder) => {
              const displayName =
                normalizeText(deckbuilder.display_name) ||
                normalizeText(deckbuilder.deckbuilder_name) ||
                "Tbot Deckbuilder";

              const username = normalizeText(deckbuilder.username);
              const bio = normalizeText(deckbuilder.bio);
              const avatar = getDiscordAvatarUrl(deckbuilder);
              const deckCount = getDeckCount(deckbuilder);

              const availableSocialConnections = socialConnections.filter(
                ({ key }) => normalizeText(deckbuilder[key]),
              );

              const deckbuilderUrl = `/deckbuilders/${encodeURIComponent(
                deckbuilder.deckbuilder_name,
              )}/decks`;

              return (
                <Link
                  to={deckbuilderUrl}
                  className="user-card user-card-link"
                  key={
                    deckbuilder.user_id || deckbuilder.deckbuilder_name
                  }
                >
                  <div className="user-card-top">
                    <div className="user-avatar">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={`${displayName} avatar`}
                          onError={(event) => {
                            const discordId = normalizeText(
                              deckbuilder.discord_id,
                            );

                            if (discordId) {
                              const numericId = Number(discordId);

                              if (Number.isFinite(numericId)) {
                                const fallbackUrl = `https://cdn.discordapp.com/embed/avatars/${
                                  Math.floor(numericId / 4194304) % 6
                                }.png`;

                                if (event.currentTarget.src !== fallbackUrl) {
                                  event.currentTarget.src = fallbackUrl;
                                  return;
                                }
                              }
                            }

                            event.currentTarget.style.display = "none";

                            const parent =
                              event.currentTarget.parentElement;

                            if (parent) {
                              parent.classList.add(
                                "user-avatar-fallback",
                              );

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
                      ) : (
                        <p className="user-card-slug">Deckbuilder</p>
                      )}
                    </div>
                  </div>

                  <div className="user-card-body">
                    {bio ? (
                      <div className="user-card-bio">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();

                                  window.open(
                                    props.href,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                              />
                            ),
                          }}
                        >
                          {bio}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="user-card-bio user-card-no-bio">
                        {deckbuilder.has_profile
                          ? "No bio provided."
                          : "No profile bio."}
                      </p>
                    )}

                    <p className="user-card-bio">
                      <strong>{deckCount}</strong> Tbot Decks
                    </p>

                    {availableSocialConnections.length > 0 && (
                      <div className="user-social-links">
                        {availableSocialConnections.map(
                          ({ key, label, Icon }) => (
                            <a
                              key={key}
                              href={normalizeText(deckbuilder[key])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="user-social-link"
                              aria-label={`${label} for ${displayName}`}
                              title={label}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                window.open(
                                  normalizeText(deckbuilder[key]),
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                            >
                              <Icon />
                            </a>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Deckbuilders;