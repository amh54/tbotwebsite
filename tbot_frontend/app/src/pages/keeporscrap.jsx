import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../css/keeporscrap.css";

const getApiBaseUrl = () => {
  const stripTrailingSlashes = (value) => {
    let normalized = value;

    while (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  };

  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return stripTrailingSlashes(envBaseUrl);
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

const SIDES = [
  { key: "Intro", label: "Intro" },
  { key: "All", label: "Keep or Scrap" },
];

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const isIntroEntry = (entry) => {
  const sideValue = normalizeText(entry.side);

  return sideValue === "intro" || sideValue === "intro/explanation";
};

const renderBoldText = (text) => {
  if (!hasValue(text)) {
    return null;
  }

  const rawText = String(text);
  const pattern = /\*\*(.+?)\*\*/g;
  const matches = [...rawText.matchAll(pattern)];

  if (matches.length === 0) {
    const lines = rawText.split(/\r?\n/);

    return lines.map((line, index) => (
      <span key={`line-${index}`}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ));
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      const textBefore = rawText.slice(lastIndex, matchIndex);
      const lines = textBefore.split(/\r?\n/);

      lines.forEach((line, lineIndex) => {
        parts.push(<span key={`text-${index}-${lineIndex}`}>{line}</span>);

        if (lineIndex < lines.length - 1) {
          parts.push(<br key={`br-${index}-${lineIndex}`} />);
        }
      });
    }

    parts.push(<strong key={`bold-${index}`}>{match[1]}</strong>);

    lastIndex = matchIndex + match[0].length;
  });

  if (lastIndex < rawText.length) {
    const textAfter = rawText.slice(lastIndex);
    const lines = textAfter.split(/\r?\n/);

    lines.forEach((line, lineIndex) => {
      parts.push(<span key={`end-${lineIndex}`}>{line}</span>);

      if (lineIndex < lines.length - 1) {
        parts.push(<br key={`end-br-${lineIndex}`} />);
      }
    });
  }

  return parts;
};

function KeepOrScrap() {
  const [entries, setEntries] = useState([]);
  const [side, setSide] = useState("Intro");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchEntries = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tbotapp/keeporscrap/`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Request failed with status ${response.status}`;

          try {
            const errorPayload = await response.json();

            if (errorPayload?.detail) {
              message = `${message}: ${errorPayload.detail}`;
            } else if (errorPayload?.error) {
              message = `${message}: ${errorPayload.error}`;
            }
          } catch (_error) {}

          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        const responseText = await response.text();

        const hint = import.meta.env.VITE_API_BASE_URL
          ? "Check that VITE_API_BASE_URL points to your backend domain."
          : "VITE_API_BASE_URL is missing; set it in frontend deployment settings.";

        if (!contentType.includes("application/json")) {
          if (responseText.trim().startsWith("<")) {
            throw new Error(
              `Received HTML instead of JSON from ${endpoint}. ${hint}`,
            );
          }

          throw new Error(
            `Unexpected response type ${
              contentType || "unknown"
            } from ${endpoint}. ${hint}`,
          );
        }

        const data = JSON.parse(responseText);

        setEntries(Array.isArray(data) ? data : []);
        setError("");
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          console.error(fetchError);

          setError(
            `Unable to load Keep or Scrap right now. ${
              fetchError.message || ""
            }`.trim(),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedGroup ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedGroup]);

  const changeSide = (newSide) => {
    setSide(newSide);
    setSelectedGroup(null);
  };

  const introEntries = useMemo(() => {
    return entries.filter(isIntroEntry).sort((a, b) => {
      const aName = normalizeText(a.name);
      const bName = normalizeText(b.name);

      const aIsPlant = aName.includes("plant");
      const bIsPlant = bName.includes("plant");
      const aIsZombie = aName.includes("zombie");
      const bIsZombie = bName.includes("zombie");

      if (aIsPlant && !bIsPlant) return -1;
      if (!aIsPlant && bIsPlant) return 1;

      if (aIsZombie && !bIsZombie) return -1;
      if (!aIsZombie && bIsZombie) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [entries]);

 const groupedClasses = useMemo(() => {
  const filtered = entries.filter(
    (entry) => !isIntroEntry(entry) && hasValue(entry.card_class),
  );

  const groups = new Map();

  filtered.forEach((entry) => {
    const key = normalizeText(entry.card_class);

    if (!groups.has(key)) {
      groups.set(key, {
        name: entry.card_class,
        side: entry.side,
        entries: [],
      });
    }

    groups.get(key).entries.push(entry);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      entries: group.entries.sort(
        (a, b) => Number(a.tierid) - Number(b.tierid),
      ),
    }))
    .sort((a, b) => {
      const aSide = normalizeText(a.side);
      const bSide = normalizeText(b.side);

      const aIsPlant = aSide === "plants" || aSide === "plant";
      const bIsPlant = bSide === "plants" || bSide === "plant";

      if (aIsPlant && !bIsPlant) return -1;
      if (!aIsPlant && bIsPlant) return 1;

      return a.name.localeCompare(b.name);
    });
}, [entries]);

  const Navbar = () => (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">Tbot</Link>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/decklists">Decklists</Link>
        <Link to="/cardinformation">Card Information</Link>
        <Link to="/heroinformation">Hero Information</Link>
        <Link to="/keeporscrap">Keep or Scrap</Link>
      </div>
    </nav>
  );

  if (loading) {
    return (
      <div className="keep-or-scrap-page">
        <Navbar />

        <main className="kos-content">
          <h1>Keep or Scrap</h1>
          <p className="kos-loading">Loading Keep or Scrap...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="keep-or-scrap-page">
      <Navbar />

      <main className="kos-content">
        <h1>Keep or Scrap</h1>

        <div className="kos-browser">
          <div className="kos-side-tabs">
            {SIDES.map((sideOption) => (
              <button
                key={sideOption.key}
                type="button"
                className={side === sideOption.key ? "active" : ""}
                onClick={() => changeSide(sideOption.key)}
              >
                {sideOption.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        {!error && side === "Intro" && (
          <div className="kos-intro">
            {introEntries.length === 0 ? (
              <p className="no-kos-results">No introduction available.</p>
            ) : (
              introEntries.map((entry) => (
                <div className="kos-intro-item" key={entry.tierid}>
                  <div className="kos-intro-media">
                    {hasValue(entry.image) && (
                      <img src={entry.image} alt="Keep or Scrap" />
                    )}
                  </div>

                  <div className="kos-intro-body">
                    {hasValue(entry.reasoning) && (
                      <p className="kos-intro-text">
                        {renderBoldText(entry.reasoning)}
                      </p>
                    )}

                    {hasValue(entry.creator) && (
                      <p className="kos-creator">{entry.creator}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!error && side === "All" && (
          <div className="kos-class-grid">
            {groupedClasses.length === 0 ? (
              <p className="no-kos-results">No Keep or Scrap entries found.</p>
            ) : (
              groupedClasses.map((group) => {
                const firstEntry = group.entries[0];

                return (
                  <section className="kos-class-section" key={group.name}>
                    <div className="kos-class-header">
                      <h2>{group.name}</h2>
                    </div>

                    <div className="kos-class-preview">
                      <div className="kos-class-media">
                        {hasValue(firstEntry?.image) && (
                          <img src={firstEntry.image} alt={group.name} />
                        )}
                      </div>

                      <div className="kos-class-content">
                        <ul className="kos-tier-list">
                          {group.entries.map((entry) => (
                            <li key={entry.tierid} className="kos-tier-item">
                              {renderBoldText(entry.reasoning)}
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          className="kos-view-details"
                          onClick={() => setSelectedGroup(group)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}
      </main>

      {selectedGroup && (
        <div
          className="kos-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedGroup(null);
            }
          }}
        >
          <div className="kos-modal">
            <button
              type="button"
              className="kos-modal-close"
              onClick={() => setSelectedGroup(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="kos-modal-header">
              <h2>{selectedGroup.name}</h2>
            </div>

            <div className="kos-modal-body">
              {hasValue(selectedGroup.entries[0]?.image) && (
                <div className="kos-modal-image">
                  <img
                    src={selectedGroup.entries[0].image}
                    alt={selectedGroup.name}
                  />
                </div>
              )}

              <div className="kos-modal-description">
                {selectedGroup.entries.map((entry) => (
                  <div className="kos-modal-entry" key={entry.tierid}>
                    {renderBoldText(entry.reasoning)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KeepOrScrap;
