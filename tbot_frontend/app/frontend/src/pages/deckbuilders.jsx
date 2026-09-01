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
    document.title = "Deckbuilders";

    return () => {
      document.title = "Tbot";
    };
  }, []);

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
      <Navbar />

      <main className="users-content">
        <div className="users-header">
          <div>
            <h1>Deckbuilders</h1>

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

              const deckbuilderUrl = `/deckbuilders/${encodeURIComponent(
                deckbuilder.deckbuilder_name,
              )}/decks`;

              return (
                <Link
                  to={deckbuilderUrl}
                  className="user-card user-card-link"
                  key={
                    deckbuilder.user_id ||
                    deckbuilder.deckbuilder_name
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

                                if (
                                  event.currentTarget.src !==
                                  fallbackUrl
                                ) {
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
                        <span>
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="user-card-info">
                      <h2>{displayName}</h2>

                      {username ? (
                        <p className="user-card-username">
                          @{username}
                        </p>
                      ) : (
                        <p className="user-card-slug">Deckbuilder</p>
                      )}
                    </div>
                  </div>

                  <div className="user-card-body">
                    {bio ? (
                      <p className="user-card-bio">{bio}</p>
                    ) : (
                      <p className="user-card-bio user-card-no-bio">
                        {deckbuilder.has_profile}
                      </p>
                    )}

                    <p className="user-card-bio">
                      <strong>{deckCount}</strong> Tbot Decks
                    </p>
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
