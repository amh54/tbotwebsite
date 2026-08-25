import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "../css/admin-keeporscrap.css";
import "../css/loading.css";

import ReactMarkdown from "react-markdown";

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
  {
    key: "Intro",
    label: "Intro",
  },
  {
    key: "All",
    label: "Keep or Scrap",
  },
];

const EMPTY_FORM = {
  tierid: "",
  side: "Plants",
  card_class: "",
  image: "",
  reasoning: "",
  creator: "",
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const isIntroEntry = (entry) => {
  const side = normalizeText(entry?.side);

  return side === "intro" || side === "intro/explanation";
};

const getCsrfToken = () => {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);

  return match ? decodeURIComponent(match[1]) : "";
};

const ensureCsrfToken = async () => {
  let token = getCsrfToken();

  if (token) {
    return token;
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Unable to initialize CSRF protection (${response.status}).`,
    );
  }

  token = getCsrfToken();

  if (!token) {
    throw new Error("Unable to obtain a CSRF token.");
  }

  return token;
};

const loadCloudinaryWidgetScript = () => {
  return new Promise((resolve, reject) => {
    if (window.cloudinary) {
      resolve(window.cloudinary);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-cloudinary-upload-widget="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(window.cloudinary),
        { once: true },
      );

      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load the Cloudinary Upload Widget.")),
        { once: true },
      );

      return;
    }

    const script = document.createElement("script");

    script.src = "https://upload-widget.cloudinary.com/latest/global/all.js";

    script.async = true;

    script.dataset.cloudinaryUploadWidget = "true";

    script.onload = () => {
      if (window.cloudinary) {
        resolve(window.cloudinary);
      } else {
        reject(new Error("Cloudinary Upload Widget loaded incorrectly."));
      }
    };

    script.onerror = () => {
      reject(new Error("Unable to load the Cloudinary Upload Widget."));
    };

    document.head.appendChild(script);
  });
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
        h1: ({ children }) => (
          <h1 className="admin-kos-intro-heading">{children}</h1>
        ),

        h2: ({ children }) => (
          <h2 className="admin-kos-intro-heading">{children}</h2>
        ),

        h3: ({ children }) => (
          <h3 className="admin-kos-intro-heading">{children}</h3>
        ),

        blockquote: ({ children }) => (
          <blockquote className="admin-kos-intro-quote">{children}</blockquote>
        ),

        p: ({ children }) => (
          <p className="admin-kos-intro-paragraph">{children}</p>
        ),

        strong: ({ children }) => <strong>{children}</strong>,

        ul: ({ children }) => (
          <ul className="admin-kos-intro-list">{children}</ul>
        ),

        ol: ({ children }) => (
          <ol className="admin-kos-intro-list">{children}</ol>
        ),

        li: ({ children }) => <li>{children}</li>,
      }}
    >
      {String(text)}
    </ReactMarkdown>
  );
};

function AdminKeepOrScrap() {
  const [entries, setEntries] = useState([]);

  const [side, setSide] = useState("Intro");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const widgetRef = useRef(null);

  const cloudinaryRef = useRef(null);

  useEffect(() => {
    document.title = "Admin - Keep or Scrap";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = editorOpen || deleteTarget ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [editorOpen, deleteTarget]);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/keeporscrap/`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
          const payload = await response.json();

          if (payload?.detail) {
            message += `: ${payload.detail}`;
          } else if (payload?.error) {
            message += `: ${payload.error}`;
          }
        } catch {
          // Ignore invalid JSON.
        }

        throw new Error(message);
      }

      const data = await response.json();

      const loadedEntries = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setEntries(loadedEntries);
    } catch (loadError) {
      console.error("Admin Keep or Scrap loading failed:", loadError);

      setError(loadError.message || "Unable to load Keep or Scrap.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const introEntries = useMemo(() => {
    return entries
      .filter(isIntroEntry)
      .sort((a, b) => Number(a.tierid) - Number(b.tierid));
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

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openAddIntro = () => {
    setEditingEntry(null);

    setForm({
      ...EMPTY_FORM,
      side: "Intro",
    });

    setError("");
    setSuccess("");

    setEditorOpen(true);
  };

  const openAddEntry = () => {
    setEditingEntry(null);

    setForm({
      ...EMPTY_FORM,
      side: "Plants",
    });

    setError("");
    setSuccess("");

    setEditorOpen(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);

    setForm({
      tierid: entry.tierid ?? "",
      side: entry.side ?? "Plants",
      card_class: entry.card_class ?? "",
      image: entry.image ?? "",
      reasoning: entry.reasoning ?? "",
      creator: entry.creator ?? "",
    });

    setError("");
    setSuccess("");

    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving || uploading) {
      return;
    }

    setEditorOpen(false);

    setEditingEntry(null);

    setForm(EMPTY_FORM);

    setError("");
  };

  const getCloudinarySignature = useCallback(async (paramsToSign) => {
    const query = new URLSearchParams();

    Object.entries(paramsToSign || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/tbotapp/admin/keeporscrap/cloudinary-signature/?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      let message = `Cloudinary signature request failed (${response.status}).`;

      try {
        const payload = await response.json();

        if (payload?.detail) {
          message += ` ${payload.detail}`;
        } else if (payload?.error) {
          message += ` ${payload.error}`;
        }
      } catch {
        // Ignore invalid JSON.
      }

      throw new Error(message);
    }

    return response.json();
  }, []);

  const initializeCloudinary = useCallback(async () => {
    if (widgetRef.current && cloudinaryRef.current) {
      return;
    }

    const cloudinary = await loadCloudinaryWidgetScript();

    cloudinaryRef.current = cloudinary;

    const configResponse = await getCloudinarySignature({
      timestamp: Math.floor(Date.now() / 1000),
    });

    if (!configResponse?.cloud_name || !configResponse?.api_key) {
      throw new Error("Cloudinary configuration could not be loaded.");
    }

    widgetRef.current = cloudinary.createUploadWidget(
      {
        cloudName: configResponse.cloud_name,

        apiKey: configResponse.api_key,

        uploadSignature: async (callback, paramsToSign) => {
          try {
            const result = await getCloudinarySignature(paramsToSign);

            callback(result.signature);
          } catch (signatureError) {
            console.error("Cloudinary signature failed:", signatureError);

            callback(null);
          }
        },

        sources: ["local", "url", "camera"],

        defaultSource: "local",

        multiple: false,

        maxFiles: 1,

        resourceType: "image",

        folder: "tbot/keep-or-scrap",

        cropping: false,

        showAdvancedOptions: false,

        singleUploadAutoClose: true,

        showUploadMoreButton: false,

        theme: "minimal",

        styles: {
          palette: {
            window: "#15181b",
            windowBorder: "#2a3034",
            tabIcon: "#8fe38b",
            menuIcons: "#8fe38b",
            textDark: "#ffffff",
            textLight: "#ffffff",
            link: "#8fe38b",
            action: "#8fe38b",
            inactiveTabIcon: "#7b858b",
            error: "#ff6b6b",
            inProgress: "#8fe38b",
            complete: "#8fe38b",
            sourceBg: "#101416",
          },
        },
      },

      (uploadError, result) => {
        if (uploadError) {
          console.error("Cloudinary upload error:", uploadError);

          setUploading(false);

          setError(
            uploadError?.status ||
              uploadError?.message ||
              "Cloudinary image upload failed.",
          );

          return;
        }

        if (result?.event === "queues-start") {
          setUploading(true);
          setError("");
          setSuccess("");
        }

        if (result?.event === "success") {
          const secureUrl = result?.info?.secure_url;

          if (!secureUrl) {
            setUploading(false);

            setError(
              "Cloudinary uploaded the image but did not return an image URL.",
            );

            return;
          }

          updateForm("image", secureUrl);

          setUploading(false);

          setSuccess("Image uploaded to Cloudinary.");
        }

        if (result?.event === "close") {
          setUploading(false);
        }
      },
    );
  }, [getCloudinarySignature]);

  const openCloudinaryUpload = async () => {
    try {
      setError("");
      setSuccess("");

      await initializeCloudinary();

      widgetRef.current?.open();
    } catch (uploadError) {
      console.error("Cloudinary initialization failed:", uploadError);

      setUploading(false);

      setError(uploadError.message || "Unable to open Cloudinary.");
    }
  };

  const removeImage = () => {
    updateForm("image", "");

    setSuccess("");
  };

  const saveEntry = async () => {
    if (saving) {
      return;
    }

    const isIntro =
      normalizeText(form.side) === "intro" ||
      normalizeText(form.side) === "intro/explanation";

    if (!hasValue(form.reasoning)) {
      setError("Reasoning / introduction text is required.");

      return;
    }

    if (!isIntro && !hasValue(form.card_class)) {
      setError("Card class is required for Keep or Scrap entries.");

      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      const csrfToken = await ensureCsrfToken();

      const payload = {
        side: form.side.trim(),

        card_class: isIntro ? "" : form.card_class.trim(),

        image: form.image.trim(),

        reasoning: form.reasoning,

        creator: form.creator.trim(),
      };

      if (editingEntry && editingEntry.tierid !== undefined) {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/keeporscrap/${editingEntry.tierid}/`,
          {
            method: "PATCH",

            credentials: "include",

            headers: {
              "Content-Type": "application/json",

              "X-CSRFToken": csrfToken,
            },

            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          let message = `Update failed with status ${response.status}`;

          try {
            const errorPayload = await response.json();

            if (errorPayload?.detail) {
              message += `: ${errorPayload.detail}`;
            } else if (errorPayload?.error) {
              message += `: ${errorPayload.error}`;
            }
          } catch {
            // Ignore invalid JSON.
          }

          throw new Error(message);
        }

        setSuccess("Keep or Scrap entry updated.");
      } else {
        const createPayload = {
          ...payload,
        };

        if (hasValue(form.tierid)) {
          createPayload.tierid = Number(form.tierid);
        }

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/keeporscrap/`,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type": "application/json",

              "X-CSRFToken": csrfToken,
            },

            body: JSON.stringify(createPayload),
          },
        );

        if (!response.ok) {
          let message = `Create failed with status ${response.status}`;

          try {
            const errorPayload = await response.json();

            if (errorPayload?.detail) {
              message += `: ${errorPayload.detail}`;
            } else if (errorPayload?.error) {
              message += `: ${errorPayload.error}`;
            }
          } catch {
            // Ignore invalid JSON.
          }

          throw new Error(message);
        }

        setSuccess("Keep or Scrap entry created.");
      }

      await loadEntries();

      setTimeout(() => {
        setEditorOpen(false);
        setEditingEntry(null);
        setForm(EMPTY_FORM);
        setSuccess("");
      }, 500);
    } catch (saveError) {
      console.error("Keep or Scrap save failed:", saveError);

      setError(saveError.message || "Unable to save Keep or Scrap entry.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async () => {
    if (!deleteTarget || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const csrfToken = await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/keeporscrap/${deleteTarget.tierid}/`,
        {
          method: "DELETE",

          credentials: "include",

          headers: {
            "X-CSRFToken": csrfToken,
          },
        },
      );

      if (!response.ok) {
        let message = `Delete failed with status ${response.status}`;

        try {
          const payload = await response.json();

          if (payload?.detail) {
            message += `: ${payload.detail}`;
          } else if (payload?.error) {
            message += `: ${payload.error}`;
          }
        } catch {
          // Ignore invalid JSON.
        }

        throw new Error(message);
      }

      setDeleteTarget(null);

      await loadEntries();

      setSuccess("Keep or Scrap entry deleted.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (deleteError) {
      console.error("Keep or Scrap delete failed:", deleteError);

      setError(deleteError.message || "Unable to delete Keep or Scrap entry.");
    } finally {
      setSaving(false);
    }
  };

  const changeSide = (newSide) => {
    setSide(newSide);

    setError("");
    setSuccess("");
  };

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

          <p>Preparing the Keep or Scrap administration page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-kos-page">
      <main className="admin-kos-content">
        <header className="admin-kos-header">
          <div>
            <div className="admin-kos-eyebrow">ADMINISTRATION</div>

            <h1>Keep or Scrap</h1>

            <p>
              Manage the recommendations and introduction content shown on Keep
              or Scrap.
            </p>
          </div>

          <button
            type="button"
            className="admin-kos-secondary-button"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
        </header>

        {error && <div className="admin-kos-alert error">{error}</div>}

        {success && <div className="admin-kos-alert success">{success}</div>}

        <div className="admin-kos-browser">
          <div className="admin-kos-tabs">
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

          <div className="admin-kos-tab-actions">
            {side === "Intro" ? (
              <button
                type="button"
                className="admin-kos-primary-button"
                onClick={
                  introEntries.length
                    ? () => openEdit(introEntries[0])
                    : openAddIntro
                }
              >
                {introEntries.length ? "Edit Intro" : "+ Add Intro"}
              </button>
            ) : (
              <button
                type="button"
                className="admin-kos-primary-button"
                onClick={openAddEntry}
              >
                + Add Entry
              </button>
            )}
          </div>
        </div>

        {side === "Intro" && (
          <section className="admin-kos-intro">
            <div className="admin-kos-section-heading">
              <div>
                <span>KEEP OR SCRAP</span>

                <h2>Introduction</h2>
              </div>
            </div>

            {introEntries.length === 0 ? (
              <div className="admin-kos-empty">
                <h3>No introduction available</h3>

                <p>
                  Add the introduction content for the public Keep or Scrap
                  page.
                </p>

                <button
                  type="button"
                  className="admin-kos-primary-button"
                  onClick={openAddIntro}
                >
                  + Create Introduction
                </button>
              </div>
            ) : (
              introEntries.map((entry) => (
                <article className="admin-kos-intro-card" key={entry.tierid}>
                  <div className="admin-kos-intro-image">
                    {hasValue(entry.image) ? (
                      <img src={entry.image} alt="Keep or Scrap introduction" />
                    ) : (
                      <div className="admin-kos-no-image">No Image</div>
                    )}
                  </div>

                  <div className="admin-kos-intro-content">
                    <div className="admin-kos-public-label">
                      PUBLIC INTRODUCTION
                    </div>

                    <div className="admin-kos-content-preview">
                      {renderIntroText(entry.reasoning)}
                    </div>

                    {hasValue(entry.creator) && (
                      <div className="admin-kos-creator">
                        <strong>Credits</strong>

                        <span>{entry.creator}</span>
                      </div>
                    )}

                    <div className="admin-kos-entry-actions">
                      <button
                        type="button"
                        className="admin-kos-edit-button"
                        onClick={() => openEdit(entry)}
                      >
                        Edit Introduction
                      </button>

                      <button
                        type="button"
                        className="admin-kos-delete-button"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {side === "All" && (
          <section className="admin-kos-classes">
            <div className="admin-kos-section-heading">
              <div>
                <span>RECOMMENDATIONS</span>

                <h2>Keep or Scrap</h2>
              </div>

              <div className="admin-kos-count">
                {entries.filter((entry) => !isIntroEntry(entry)).length} entries
              </div>
            </div>

            {groupedClasses.length === 0 ? (
              <div className="admin-kos-empty">
                <h3>No recommendations</h3>

                <p>Add your first Keep or Scrap recommendation.</p>

                <button
                  type="button"
                  className="admin-kos-primary-button"
                  onClick={openAddEntry}
                >
                  + Add Recommendation
                </button>
              </div>
            ) : (
              <div className="admin-kos-class-grid">
                {groupedClasses.map((group) => {
                  const firstEntry = group.entries[0];

                  return (
                    <section className="admin-kos-class-card" key={group.name}>
                      <div className="admin-kos-class-top">
                        <div>
                          <span>{group.side}</span>

                          <h2>{group.name}</h2>
                        </div>

                        <div className="admin-kos-entry-count">
                          {group.entries.length} tiers
                        </div>
                      </div>

                      <div className="admin-kos-class-main">
                        <div className="admin-kos-class-image">
                          {hasValue(firstEntry?.image) ? (
                            <img src={firstEntry.image} alt={group.name} />
                          ) : (
                            <div className="admin-kos-no-image">No Image</div>
                          )}
                        </div>

                        <div className="admin-kos-tier-list">
                          {group.entries.map((entry) => (
                            <div
                              className="admin-kos-tier-item"
                              key={entry.tierid}
                            >
                              <div className="admin-kos-tier-info">
                                <div className="admin-kos-tier-number">
                                  Tier {entry.tierid}
                                </div>

                                <div className="admin-kos-tier-text">
                                  {renderBoldText(entry.reasoning)}
                                </div>
                              </div>

                              <div className="admin-kos-tier-actions">
                                <button
                                  type="button"
                                  className="admin-kos-edit-small"
                                  onClick={() => openEdit(entry)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="admin-kos-delete-small"
                                  onClick={() => setDeleteTarget(entry)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {editorOpen && (
        <div
          className="admin-kos-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor();
            }
          }}
        >
          <div className="admin-kos-editor-modal">
            <div className="admin-kos-modal-header">
              <div>
                <span>{editingEntry ? "EDIT ENTRY" : "NEW ENTRY"}</span>

                <h2>
                  {normalizeText(form.side) === "intro"
                    ? editingEntry
                      ? "Edit Introduction"
                      : "Add Introduction"
                    : editingEntry
                      ? "Edit Recommendation"
                      : "Add Recommendation"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-kos-modal-close"
                onClick={closeEditor}
                disabled={saving || uploading}
              >
                ×
              </button>
            </div>

            <div className="admin-kos-editor-body">
              <div className="admin-kos-form-grid">
                {!editingEntry && (
                  <label>
                    <span>Tier ID</span>

                    <input
                      type="number"
                      value={form.tierid}
                      onChange={(event) =>
                        updateForm("tierid", event.target.value)
                      }
                      placeholder="Auto-generated"
                    />
                  </label>
                )}

                <label>
                  <span>Side</span>

                  <select
                    value={form.side}
                    onChange={(event) => updateForm("side", event.target.value)}
                  >
                    <option value="Intro">Intro</option>

                    <option value="Plants">Plants</option>

                    <option value="Zombies">Zombies</option>
                  </select>
                </label>

                {normalizeText(form.side) !== "intro" && (
                  <label>
                    <span>Card Class</span>

                    <input
                      type="text"
                      value={form.card_class}
                      onChange={(event) =>
                        updateForm("card_class", event.target.value)
                      }
                      placeholder="Example: Guardian"
                    />
                  </label>
                )}

                <div className="admin-kos-form-full">
                  <div className="admin-kos-upload-heading">
                    <div>
                      <span>IMAGE</span>

                      <strong>Keep or Scrap Image</strong>
                    </div>

                    <button
                      type="button"
                      className="admin-kos-upload-button"
                      onClick={openCloudinaryUpload}
                      disabled={uploading || saving}
                    >
                      {uploading ? "Uploading..." : "Upload to Cloudinary"}
                    </button>
                  </div>

                  {hasValue(form.image) ? (
                    <div className="admin-kos-upload-preview">
                      <div className="admin-kos-upload-preview-image">
                        <img src={form.image} alt="Keep or Scrap preview" />
                      </div>

                      <div className="admin-kos-upload-preview-info">
                        <span>Cloudinary Image</span>

                        <small>
                          Image is stored in your Cloudinary account.
                        </small>

                        <button
                          type="button"
                          className="admin-kos-remove-image"
                          onClick={removeImage}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="admin-kos-upload-dropzone"
                      onClick={openCloudinaryUpload}
                    >
                      <span className="admin-kos-upload-icon">↑</span>

                      <strong>Upload Keep or Scrap Image</strong>

                      <small>
                        Choose an image from your computer using Cloudinary.
                      </small>
                    </button>
                  )}
                </div>

                <label className="admin-kos-form-full">
                  <span>
                    {normalizeText(form.side) === "intro"
                      ? "Introduction Markdown"
                      : "Reasoning"}
                  </span>

                  <textarea
                    value={form.reasoning}
                    onChange={(event) =>
                      updateForm("reasoning", event.target.value)
                    }
                    rows={14}
                    placeholder={
                      normalizeText(form.side) === "intro"
                        ? "Write the Keep or Scrap introduction using Markdown..."
                        : "Explain why these cards belong in this recommendation tier..."
                    }
                  />

                  {normalizeText(form.side) === "intro" && (
                    <small className="admin-kos-markdown-help">
                      Markdown is supported. Use **bold**, headings, lists, and
                      blockquotes.
                    </small>
                  )}
                </label>

                <label className="admin-kos-form-full">
                  <span>Credits</span>

                  <input
                    type="text"
                    value={form.creator}
                    onChange={(event) =>
                      updateForm("creator", event.target.value)
                    }
                    placeholder="Credit the author or source"
                  />
                </label>
              </div>
            </div>

            <div className="admin-kos-editor-footer">
              <button
                type="button"
                className="admin-kos-secondary-button"
                onClick={closeEditor}
                disabled={saving || uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-kos-primary-button"
                onClick={saveEntry}
                disabled={saving || uploading}
              >
                {saving
                  ? "Saving..."
                  : editingEntry
                    ? "Save Changes"
                    : "Create Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="admin-kos-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="admin-kos-delete-modal">
            <div className="admin-kos-delete-icon">!</div>

            <h2>Delete Keep or Scrap Entry?</h2>

            <p>
              This will permanently delete tier{" "}
              <strong>{deleteTarget.tierid}</strong>
              .
              <br />
              This action cannot be undone.
            </p>

            <div className="admin-kos-delete-actions">
              <button
                type="button"
                className="admin-kos-secondary-button"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-kos-danger-button"
                onClick={deleteEntry}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminKeepOrScrap;
