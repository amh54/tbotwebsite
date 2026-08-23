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
    const extension = avatar.startsWith("a_") ? "gif" : "png";

    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
  }

  return "";
};

function Deckbuilders() {
  const [deckbuilders, setDeckbuilders] = useState([]);

  const [totalDeckbuilders, setTotalDeckbuilders] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

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
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load deckbuilder count:", err);
        }
      }
    };

    fetchCount();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadingStartTime = Date.now();

    const minimumLoadingTime = 1200;

    const loadDeckbuilders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/tbotapp/deckbuilders/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

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

        setTotalDeckbuilders((currentCount) =>
          currentCount !== null ? currentCount : results.length,
        );

        const elapsed = Date.now() - loadingStartTime;

        const remaining = Math.max(minimumLoadingTime - elapsed, 0);

        window.setTimeout(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }, remaining);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Unable to load deckbuilders:", err);

        setError(err.message || "Unable to load deckbuilders right now.");

        setLoading(false);
      }
    };

    loadDeckbuilders();

    return () => controller.abort();
  }, []);
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

  if (loading) {
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

              const profileSlug = normalizeText(deckbuilder.profile_slug);

              const avatar = getDiscordAvatarUrl(deckbuilder);

              const deckCount = getDeckCount(deckbuilder);

              return (
                <article
                  className="user-card"
                  key={deckbuilder.user_id || deckbuilder.deckbuilder_name}
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
                                const fallbackUrl = `https://cdn.discordapp.com/embed/avatars/${(numericId >> 22) % 6}.png`;

                                if (event.currentTarget.src !== fallbackUrl) {
                                  event.currentTarget.src = fallbackUrl;

                                  return;
                                }
                              }
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

                  <div className="user-card-actions">
                    {profileSlug ? (
                      <Link
                        to={`/profile/${encodeURIComponent(profileSlug)}`}
                        className="user-profile-button"
                      >
                        View Profile
                      </Link>
                    ) : null}

                    <Link
                      to={`/deckbuilders/${encodeURIComponent(
                        deckbuilder.deckbuilder_name,
                      )}/decks`}
                      className="user-decklists-button"
                    >
                      View Decks
                    </Link>
                  </div>
                </article>
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
