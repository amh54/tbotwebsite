import { useEffect, useMemo, useState } from "react";

import "../css/keeporscrap.css";
import "../css/loading.css";

import ReactMarkdown from "react-markdown";

import Navbar from "../components/navbar";
import Footer from "../components/footer";

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

let keepOrScrapCache = {
  loaded: false,
  entries: [],
  totalEntries: null,
};

const SIDES = [
  {
    key: "Intro",
    label: "Intro",
  },
  {
    key: "All",
    label: "Keep or Scrap",
  },
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

const renderIntroText = (text) => {
  if (!hasValue(text)) {
    return null;
  }

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="kos-intro-heading">{children}</h1>,

        h2: ({ children }) => <h2 className="kos-intro-heading">{children}</h2>,

        h3: ({ children }) => <h3 className="kos-intro-heading">{children}</h3>,

        blockquote: ({ children }) => (
          <blockquote className="kos-intro-quote">{children}</blockquote>
        ),

        p: ({ children }) => <p className="kos-intro-paragraph">{children}</p>,

        strong: ({ children }) => <strong>{children}</strong>,

        ul: ({ children }) => <ul className="kos-intro-list">{children}</ul>,

        ol: ({ children }) => <ol className="kos-intro-list">{children}</ol>,

        li: ({ children }) => <li>{children}</li>,
      }}
    >
      {String(text)}
    </ReactMarkdown>
  );
};

const renderCreatorText = (text) => {
  if (!hasValue(text)) {
    return null;
  }

  const rawText = String(text).trim();

  const headingMatch = rawText.match(/^([^:]+:)\s\*\*/);

  const heading = headingMatch ? headingMatch[1] : null;

  const rest = headingMatch ? rawText.slice(headingMatch[0].length) : rawText;

  const items = rest
    .replace(/^-\s\*\*/, "")
    .split(/\s+-\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length <= 1) {
    return <span>{rawText}</span>;
  }

  return (
    <>
      {heading && <span className="kos-creator-heading">{heading}</span>}

      <ul className="kos-creator-list">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </>
  );
};

function KeepOrScrap() {
  const [entries, setEntries] = useState(keepOrScrapCache.entries);

  const [side, setSide] = useState("Intro");

  const [selectedGroup, setSelectedGroup] = useState(null);

  const [loading, setLoading] = useState(!keepOrScrapCache.loaded);

  const [error, setError] = useState("");

  const [totalEntries, setTotalEntries] = useState(
    keepOrScrapCache.totalEntries,
  );

  useEffect(() => {
    document.title = "Keep or Scrap";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    if (keepOrScrapCache.loaded) {
      return;
    }

    const controller = new AbortController();

    const fetchCount = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tbotapp/keeporscrap/count/`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Count request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        const apiCount = Number(data?.count);

        if (!Number.isFinite(apiCount)) {
          setTotalEntries(0);
          return;
        }

        const actualCount = Math.max(0, apiCount - 1);

        keepOrScrapCache.totalEntries = actualCount;

        setTotalEntries(actualCount);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }

        console.error("Keep or Scrap count loading failed:", fetchError);

        setTotalEntries(null);
      }
    };

    fetchCount();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (keepOrScrapCache.loaded) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchEntries = async () => {
      try {
        setLoading(true);
        setError("");

        const endpoint = `${API_BASE_URL}/tbotapp/keeporscrap/`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Request failed with status ${response.status}`;

          try {
            const errorPayload = await response.json();

            if (errorPayload?.detail) {
              message += `: ${errorPayload.detail}`;
            } else if (errorPayload?.error) {
              message += `: ${errorPayload.error}`;
            }
          } catch {
            // Ignore JSON parsing errors.
          }

          throw new Error(message);
        }

        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();

        const responseText = await response.text();

        if (!contentType.includes("application/json")) {
          if (responseText.trim().startsWith("<")) {
            throw new Error(`Received HTML instead of JSON from ${endpoint}.`);
          }

          throw new Error(
            `Unexpected response type ${
              contentType || "unknown"
            } from ${endpoint}.`,
          );
        }

        const data = JSON.parse(responseText);

        const loadedEntries = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        keepOrScrapCache.entries = loadedEntries;
        keepOrScrapCache.loaded = true;

        setEntries(loadedEntries);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }

        console.error("Keep or Scrap loading failed:", fetchError);

        setError(
          `Unable to load Keep or Scrap right now. ${
            fetchError.message || ""
          }`.trim(),
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEntries();

    return () => {
      controller.abort();
    };
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

      if (aIsPlant && !bIsPlant) {
        return -1;
      }

      if (!aIsPlant && bIsPlant) {
        return 1;
      }

      if (aIsZombie && !bIsZombie) {
        return -1;
      }

      if (!aIsZombie && bIsZombie) {
        return 1;
      }

      return aName.localeCompare(bName);
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

        if (aIsPlant && !bIsPlant) {
          return -1;
        }

        if (!aIsPlant && bIsPlant) {
          return 1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [entries]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>
            Loading Keep or Scrap
            <span className="loading-dots">
              <span />
              <span />
              <span />
            </span>
          </h2>

          <p>
            Preparing the Keep or Scrap browser and loading available entries.
          </p>

          <div className="loading-status">
            <span>Loading Keep or Scrap data</span>

            <strong>
              {totalEntries !== null
                ? `${totalEntries} entries`
                : "Loading count..."}
            </strong>
          </div>
        </div>
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
                      <div className="kos-intro-text">
                        {renderIntroText(entry.reasoning)}
                      </div>
                    )}

                    {hasValue(entry.creator) && (
                      <div className="kos-creator">
                        <strong className="kos-intro-label kos-creator-label">
                          Credits:
                        </strong>

                        {renderCreatorText(entry.creator)}
                      </div>
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
                  <section
                    className="kos-class-section"
                    key={group.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedGroup(group)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedGroup(group);
                      }
                    }}
                  >
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

      <Footer />
    </div>
  );
}

export default KeepOrScrap;
