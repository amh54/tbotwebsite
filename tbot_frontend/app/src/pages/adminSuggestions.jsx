import { useEffect, useMemo, useState } from "react";

import Footer from "../components/footer";

import "../css/adminbugreports.css";

import "../css/loading.css";

const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

let csrfToken = null;

const getCookie = (name) => {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const cookie of cookies) {
    const trimmed = cookie.trim();

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }

  return null;
};

const ensureCsrfToken = async (forceRefresh = false) => {
  if (!forceRefresh && csrfToken) {
    return csrfToken;
  }

  if (!forceRefresh) {
    const existingToken = getCookie("csrftoken");

    if (existingToken) {
      csrfToken = existingToken;
      return csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Unable to initialize CSRF protection. Status ${response.status}.`,
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const freshToken =
    data?.csrfToken || data?.csrf_token || getCookie("csrftoken");

  if (!freshToken) {
    throw new Error(
      "CSRF token is missing. Please refresh the page and try again.",
    );
  }

  csrfToken = freshToken;

  return csrfToken;
};

const getApiErrorMessage = async (response, fallback) => {
  let message = fallback;

  try {
    const data = await response.json();

    if (data?.detail) {
      message += `: ${data.detail}`;
    } else if (data?.error) {
      message += `: ${data.error}`;
    } else if (data && typeof data === "object") {
      const fieldMessages = Object.entries(data)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(", ")
            : String(messages);

          return `${field}: ${text}`;
        })
        .join(" | ");

      if (fieldMessages) {
        message += `: ${fieldMessages}`;
      }
    }
  } catch {
    return message;
  }

  return message;
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

const getSuggestionId = (suggestion) =>
  suggestion?.id ?? suggestion?.suggestion_id ?? suggestion?.suggestionId;

const getSuggestionTitle = (suggestion) =>
  suggestion?.title || suggestion?.subject || "Untitled Suggestion";

const getSuggestionDescription = (suggestion) =>
  suggestion?.description || suggestion?.details || suggestion?.message || "";

const getSuggestionCategory = (suggestion) => suggestion?.category || "other";

const getSuggestionStatus = (suggestion) => suggestion?.status || "pending";

const getSubmitterName = (suggestion) =>
  suggestion?.discord_username ||
  suggestion?.username ||
  suggestion?.display_name ||
  suggestion?.displayName ||
  suggestion?.discordUsername ||
  suggestion?.user?.username ||
  suggestion?.user?.display_name ||
  suggestion?.user?.displayName ||
  "Unknown User";

const getSubmitterAvatar = (suggestion) =>
  suggestion?.avatar ||
  suggestion?.avatar_url ||
  suggestion?.avatarUrl ||
  suggestion?.discord_avatar ||
  suggestion?.discordAvatar ||
  suggestion?.user?.avatar ||
  suggestion?.user?.avatar_url ||
  "";

const getCreatedDate = (suggestion) =>
  suggestion?.created_at ||
  suggestion?.createdAt ||
  suggestion?.submitted_at ||
  suggestion?.submittedAt ||
  null;

const getUpdatedDate = (suggestion) =>
  suggestion?.updated_at || suggestion?.updatedAt || null;

const formatDate = (value) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeStatus = (status) => {
  const value = normalizeText(status);

  if (value === "reviewing") {
    return "reviewing";
  }

  if (value === "planned") {
    return "planned";
  }

  if (value === "completed") {
    return "completed";
  }

  if (value === "declined") {
    return "declined";
  }

  return "pending";
};

const formatStatus = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") {
    return "Reviewing";
  }

  if (normalized === "planned") {
    return "Planned";
  }

  if (normalized === "completed") {
    return "Completed";
  }

  if (normalized === "declined") {
    return "Declined";
  }

  return "Pending";
};

const formatCategory = (category) => {
  const value = normalizeText(category);

  if (!value) {
    return "Other";
  }

  const labels = {
    improvement: "Improvement",
    feature: "New Feature",
    "ui / design": "UI / Design",
    ui: "UI / Design",
    performance: "Performance",
    other: "Other",
  };

  return (
    labels[value] ||
    value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

const getStatusDescription = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") {
    return "This suggestion is currently being reviewed.";
  }

  if (normalized === "planned") {
    return "This suggestion is planned for a future Tbot update.";
  }

  if (normalized === "completed") {
    return "This suggestion has been implemented or completed.";
  }

  if (normalized === "declined") {
    return "This suggestion will not be implemented at this time.";
  }

  return "This suggestion is waiting to be reviewed.";
};

function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const [adminResponse, setAdminResponse] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    document.title = "Admin - Suggestions";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      console.error("Unable to initialize CSRF:", err);
    });
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/suggestions/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Request failed with status ${response.status}`,
        );

        if (response.status === 401) {
          throw new Error(
            "You must be logged in with Discord to access the admin page.",
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Owner permissions are required to access suggestions.",
          );
        }

        throw new Error(message);
      }

      const data = await response.json();

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.suggestions)
            ? data.suggestions
            : [];

      setSuggestions(results);
    } catch (err) {
      console.error("Unable to load suggestions:", err);

      setError(err.message || "Unable to load suggestions right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const filteredSuggestions = useMemo(() => {
    const query = normalizeText(search);

    return suggestions.filter((suggestion) => {
      const status = normalizeStatus(getSuggestionStatus(suggestion));

      const category = normalizeText(getSuggestionCategory(suggestion));

      const searchText = [
        getSuggestionTitle(suggestion),
        getSuggestionDescription(suggestion),
        getSuggestionCategory(suggestion),
        getSubmitterName(suggestion),
        suggestion?.discord_id,
        suggestion?.browser,
        suggestion?.operating_system,
        suggestion?.page_url,
        suggestion?.admin_response,
        suggestion?.admin_notes,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .join(" ");

      const matchesSearch = !query || searchText.includes(query);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suggestions, search, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    const result = {
      all: suggestions.length,
      pending: 0,
      reviewing: 0,
      planned: 0,
      completed: 0,
      declined: 0,
    };

    suggestions.forEach((suggestion) => {
      const status = normalizeStatus(getSuggestionStatus(suggestion));

      if (result[status] !== undefined) {
        result[status] += 1;
      }
    });

    return result;
  }, [suggestions]);

  const handleStatusChange = async (suggestion, newStatus) => {
    const suggestionId = getSuggestionId(suggestion);

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This suggestion does not have a valid ID.");
      return;
    }

    const normalizedStatus = normalizeStatus(newStatus);

    try {
      setUpdatingId(suggestionId);
      setActionError("");

      let token = await ensureCsrfToken();

      let response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/suggestions/${suggestionId}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
          body: JSON.stringify({
            status: normalizedStatus,
          }),
        },
      );

      if (response.status === 403) {
        token = await ensureCsrfToken(true);

        response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/suggestions/${suggestionId}/`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-CSRFToken": token,
            },
            body: JSON.stringify({
              status: normalizedStatus,
            }),
          },
        );
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Unable to update suggestion. Status ${response.status}`,
        );

        throw new Error(message);
      }

      let updatedSuggestion = null;

      try {
        updatedSuggestion = await response.json();
      } catch {
        updatedSuggestion = null;
      }

      setSuggestions((currentSuggestions) =>
        currentSuggestions.map((currentSuggestion) =>
          String(getSuggestionId(currentSuggestion)) === String(suggestionId)
            ? updatedSuggestion || {
                ...currentSuggestion,
                status: normalizedStatus,
              }
            : currentSuggestion,
        ),
      );

      setSelectedSuggestion((current) => {
        if (!current) {
          return current;
        }

        if (String(getSuggestionId(current)) !== String(suggestionId)) {
          return current;
        }

        return (
          updatedSuggestion || {
            ...current,
            status: normalizedStatus,
          }
        );
      });
    } catch (error) {
      console.error("Unable to update suggestion:", error);

      setActionError(
        error instanceof Error ? error.message : "Unable to update suggestion.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedSuggestion) {
      return;
    }

    const suggestionId = getSuggestionId(selectedSuggestion);

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This suggestion does not have a valid ID.");
      return;
    }

    try {
      setSavingDetails(true);
      setActionError("");

      let token = await ensureCsrfToken();

      let response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/suggestions/${suggestionId}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
          body: JSON.stringify({
            admin_response: adminResponse,
            admin_notes: adminNotes,
          }),
        },
      );

      if (response.status === 403) {
        token = await ensureCsrfToken(true);

        response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/suggestions/${suggestionId}/`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-CSRFToken": token,
            },
            body: JSON.stringify({
              admin_response: adminResponse,
              admin_notes: adminNotes,
            }),
          },
        );
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Unable to save suggestion details. Status ${response.status}`,
        );

        throw new Error(message);
      }

      let updatedSuggestion = null;

      try {
        updatedSuggestion = await response.json();
      } catch {
        updatedSuggestion = null;
      }

      const updated = updatedSuggestion || {
        ...selectedSuggestion,
        admin_response: adminResponse,
        admin_notes: adminNotes,
      };

      setSuggestions((currentSuggestions) =>
        currentSuggestions.map((currentSuggestion) =>
          String(getSuggestionId(currentSuggestion)) === String(suggestionId)
            ? updated
            : currentSuggestion,
        ),
      );

      setSelectedSuggestion(updated);
    } catch (error) {
      console.error("Unable to save suggestion details:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to save suggestion details.",
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDelete = async (suggestion) => {
    const suggestionId = getSuggestionId(suggestion);

    if (suggestionId === undefined || suggestionId === null) {
      setActionError("This suggestion does not have a valid ID.");
      return;
    }

    const title = getSuggestionTitle(suggestion);

    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(suggestionId);
      setActionError("");

      let token = await ensureCsrfToken();

      let response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/suggestions/${suggestionId}/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": token,
          },
        },
      );

      if (response.status === 403) {
        token = await ensureCsrfToken(true);

        response = await fetch(
          `${API_BASE_URL}/tbotapp/admin/suggestions/${suggestionId}/`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "X-CSRFToken": token,
            },
          },
        );
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Unable to delete suggestion. Status ${response.status}`,
        );

        throw new Error(message);
      }

      setSuggestions((currentSuggestions) =>
        currentSuggestions.filter(
          (currentSuggestion) =>
            String(getSuggestionId(currentSuggestion)) !== String(suggestionId),
        ),
      );

      setSelectedSuggestion((current) => {
        if (!current) {
          return null;
        }

        return String(getSuggestionId(current)) === String(suggestionId)
          ? null
          : current;
      });
    } catch (err) {
      console.error("Unable to delete suggestion:", err);

      setActionError(err.message || "Unable to delete suggestion.");
    } finally {
      setDeletingId(null);
    }
  };

  const openDetails = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminResponse(suggestion?.admin_response || "");
    setAdminNotes(suggestion?.admin_notes || "");
    setActionError("");
  };

  const closeDetails = () => {
    setSelectedSuggestion(null);
    setAdminResponse("");
    setAdminNotes("");
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner" />

          <h2>Loading suggestions</h2>

          <p>
            Preparing the suggestion dashboard and loading submitted
            suggestions.
          </p>

          <div className="loading-status">
            <span>Loading suggestion data</span>

            <strong>Loading...</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-bugreports-page">
      <main className="admin-bugreports-content">
        <div className="admin-bugreports-topbar">
          <div>
            <span className="admin-bugreports-eyebrow">ADMINISTRATION</span>

            <h1>Suggestions</h1>

            <p>
              Review, manage, and respond to suggestions submitted by the Tbot
              community.
            </p>
          </div>

          <div className="admin-bugreports-actions">
            <button
              type="button"
              className="admin-bugreports-back"
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              ← Admin
            </button>

            <button
              type="button"
              className="admin-bugreports-refresh"
              onClick={fetchSuggestions}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-bugreports-error">
            <strong>Unable to load suggestions</strong>

            <span>{error}</span>
          </div>
        )}

        {actionError && (
          <div className="admin-bugreports-error">
            <strong>Action failed</strong>

            <span>{actionError}</span>

            <button type="button" onClick={() => setActionError("")}>
              ×
            </button>
          </div>
        )}

        {!error && (
          <>
            <section className="admin-bugreports-stats">
              <button
                type="button"
                className={
                  statusFilter === "all"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() => setStatusFilter("all")}
              >
                <span className="admin-bugreports-stat-label">
                  All Suggestions
                </span>

                <strong>{counts.all}</strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "pending"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() => setStatusFilter("pending")}
              >
                <span className="admin-bugreports-stat-label">Pending</span>

                <strong>{counts.pending}</strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "reviewing"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() => setStatusFilter("reviewing")}
              >
                <span className="admin-bugreports-stat-label">Reviewing</span>

                <strong>{counts.reviewing}</strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "planned"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() => setStatusFilter("planned")}
              >
                <span className="admin-bugreports-stat-label">Planned</span>

                <strong>{counts.planned}</strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "completed"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() => setStatusFilter("completed")}
              >
                <span className="admin-bugreports-stat-label">Completed</span>

                <strong>{counts.completed}</strong>
              </button>

              <button
                type="button"
                className={
                  statusFilter === "declined"
                    ? "admin-bugreports-stat active"
                    : "admin-bugreports-stat"
                }
                onClick={() => setStatusFilter("declined")}
              >
                <span className="admin-bugreports-stat-label">Declined</span>

                <strong>{counts.declined}</strong>
              </button>
            </section>

            <section className="admin-bugreports-toolbar">
              <div className="admin-bugreports-search">
                <span>⌕</span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search suggestions, users, categories..."
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="admin-bugreports-status-filter"
              >
                <option value="all">All Categories</option>

                <option value="improvement">Improvement</option>

                <option value="feature">New Feature</option>

                <option value="ui">UI / Design</option>

                <option value="performance">Performance</option>

                <option value="other">Other</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="admin-bugreports-status-filter"
              >
                <option value="all">All Statuses</option>

                <option value="pending">Pending</option>

                <option value="reviewing">Reviewing</option>

                <option value="planned">Planned</option>

                <option value="completed">Completed</option>

                <option value="declined">Declined</option>
              </select>
            </section>

            <div className="admin-bugreports-results">
              <span>
                Showing <strong>{filteredSuggestions.length}</strong> of{" "}
                <strong>{suggestions.length}</strong> suggestions
              </span>
            </div>

            {filteredSuggestions.length === 0 ? (
              <section className="admin-bugreports-empty">
                <div className="admin-bugreports-empty-icon">✓</div>

                <h2>No suggestions found</h2>

                <p>
                  There are no suggestions matching your current search and
                  filters.
                </p>

                {(search ||
                  statusFilter !== "all" ||
                  categoryFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setCategoryFilter("all");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </section>
            ) : (
              <section className="admin-bugreports-list">
                {filteredSuggestions.map((suggestion) => {
                  const suggestionId = getSuggestionId(suggestion);

                  const title = getSuggestionTitle(suggestion);

                  const description = getSuggestionDescription(suggestion);

                  const category = getSuggestionCategory(suggestion);

                  const status = normalizeStatus(
                    getSuggestionStatus(suggestion),
                  );

                  const reporter = getSubmitterName(suggestion);

                  const avatar = getSubmitterAvatar(suggestion);

                  return (
                    <article
                      key={
                        suggestionId ?? `${title}-${getCreatedDate(suggestion)}`
                      }
                      className={`admin-bugreport-card status-${status}`}
                    >
                      <div className="admin-bugreport-card-accent" />

                      <div className="admin-bugreport-card-main">
                        <div className="admin-bugreport-card-header">
                          <div className="admin-bugreport-card-title">
                            <div className="admin-bugreport-card-meta">
                              <span className="admin-bugreport-category">
                                {formatCategory(category)}
                              </span>

                              <span
                                className={`admin-bugreport-status status-${status}`}
                              >
                                {formatStatus(status)}
                              </span>
                            </div>

                            <h2>{title}</h2>

                            <div className="admin-bugreport-reporter">
                              {avatar ? (
                                <img src={avatar} alt={reporter} />
                              ) : (
                                <span className="admin-bugreport-avatar-fallback">
                                  {reporter.charAt(0).toUpperCase()}
                                </span>
                              )}

                              <span>
                                <strong>{reporter}</strong>

                                <small>
                                  {formatDate(getCreatedDate(suggestion))}
                                </small>
                              </span>
                            </div>
                          </div>

                          <div className="admin-bugreport-card-controls">
                            <select
                              value={status}
                              disabled={
                                updatingId !== null &&
                                String(updatingId) === String(suggestionId)
                              }
                              onChange={(event) =>
                                handleStatusChange(
                                  suggestion,
                                  event.target.value,
                                )
                              }
                              aria-label={`Change status for ${title}`}
                            >
                              <option value="pending">Pending</option>

                              <option value="reviewing">Reviewing</option>

                              <option value="planned">Planned</option>

                              <option value="completed">Completed</option>

                              <option value="declined">Declined</option>
                            </select>

                            <button
                              type="button"
                              className="admin-bugreport-delete"
                              disabled={
                                deletingId !== null &&
                                String(deletingId) === String(suggestionId)
                              }
                              onClick={() => handleDelete(suggestion)}
                            >
                              {deletingId !== null &&
                              String(deletingId) === String(suggestionId)
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>

                        <div className="admin-bugreport-description">
                          {description ? (
                            <p>{description}</p>
                          ) : (
                            <p className="empty-description">
                              No description provided.
                            </p>
                          )}
                        </div>

                        <div className="admin-bugreport-footer">
                          <div className="admin-bugreport-details">
                            {suggestion?.browser && (
                              <span>
                                <strong>Browser:</strong> {suggestion.browser}
                              </span>
                            )}

                            {suggestion?.operating_system && (
                              <span>
                                <strong>OS:</strong>{" "}
                                {suggestion.operating_system}
                              </span>
                            )}

                            {suggestion?.page_url && (
                              <span>
                                <strong>Page:</strong> {suggestion.page_url}
                              </span>
                            )}
                          </div>

                          <div className="admin-bugreport-footer-actions">
                            {suggestion?.admin_response && (
                              <span className="admin-suggestion-response-badge">
                                ✓ Response Sent
                              </span>
                            )}

                            <button
                              type="button"
                              className="admin-bugreport-view-button"
                              onClick={() => openDetails(suggestion)}
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>

      <Footer />

      {selectedSuggestion && (
        <div
          className="admin-bugreport-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div className="admin-bugreport-modal">
            <div className="admin-bugreport-modal-header">
              <div>
                <span className="admin-bugreports-eyebrow">SUGGESTION</span>

                <h2>{getSuggestionTitle(selectedSuggestion)}</h2>

                <p>
                  Submitted by{" "}
                  <strong>{getSubmitterName(selectedSuggestion)}</strong>
                </p>
              </div>

              <button
                type="button"
                className="admin-bugreport-modal-close"
                onClick={closeDetails}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="admin-bugreport-modal-body">
              <div className="admin-bugreport-modal-status-row">
                <span
                  className={`admin-bugreport-status status-${normalizeStatus(
                    getSuggestionStatus(selectedSuggestion),
                  )}`}
                >
                  {formatStatus(getSuggestionStatus(selectedSuggestion))}
                </span>

                <span>{formatDate(getCreatedDate(selectedSuggestion))}</span>
              </div>

              <div className="admin-bugreport-detail-section">
                <span className="admin-bugreport-detail-label">CATEGORY</span>

                <strong>
                  {formatCategory(getSuggestionCategory(selectedSuggestion))}
                </strong>
              </div>

              <div className="admin-bugreport-detail-section">
                <span className="admin-bugreport-detail-label">
                  DESCRIPTION
                </span>

                <p>
                  {getSuggestionDescription(selectedSuggestion) ||
                    "No description provided."}
                </p>
              </div>

              <div className="admin-bugreport-detail-grid">
                {selectedSuggestion?.browser && (
                  <div>
                    <span>Browser</span>

                    <strong>{selectedSuggestion.browser}</strong>
                  </div>
                )}

                {selectedSuggestion?.operating_system && (
                  <div>
                    <span>Operating System</span>

                    <strong>{selectedSuggestion.operating_system}</strong>
                  </div>
                )}

                {selectedSuggestion?.page_url && (
                  <div>
                    <span>Page URL</span>

                    <strong>{selectedSuggestion.page_url}</strong>
                  </div>
                )}

                {selectedSuggestion?.discord_id && (
                  <div>
                    <span>Discord ID</span>

                    <strong>{selectedSuggestion.discord_id}</strong>
                  </div>
                )}

                {getUpdatedDate(selectedSuggestion) && (
                  <div>
                    <span>Last Updated</span>

                    <strong>
                      {formatDate(getUpdatedDate(selectedSuggestion))}
                    </strong>
                  </div>
                )}
              </div>

              <div className="admin-bugreport-detail-section admin-suggestion-editor">
                <span className="admin-bugreport-detail-label">
                  ADMIN RESPONSE
                </span>

                <textarea
                  value={adminResponse}
                  onChange={(event) => setAdminResponse(event.target.value)}
                  placeholder="Write a response that will be visible to the user..."
                  rows={5}
                  disabled={savingDetails}
                />
              </div>

              <div className="admin-bugreport-detail-section admin-suggestion-editor">
                <span className="admin-bugreport-detail-label">
                  ADMIN NOTES
                </span>

                <textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder="Private notes for admins..."
                  rows={4}
                  disabled={savingDetails}
                />
              </div>

              {selectedSuggestion?.admin_response && (
                <div className="admin-bugreport-detail-section">
                  <span className="admin-bugreport-detail-label">
                    CURRENT USER RESPONSE
                  </span>

                  <p>{selectedSuggestion.admin_response}</p>
                </div>
              )}

              {selectedSuggestion?.admin_notes && (
                <div className="admin-bugreport-detail-section">
                  <span className="admin-bugreport-detail-label">
                    CURRENT ADMIN NOTES
                  </span>

                  <p>{selectedSuggestion.admin_notes}</p>
                </div>
              )}
            </div>

            <div className="admin-bugreport-modal-actions">
              <select
                value={normalizeStatus(getSuggestionStatus(selectedSuggestion))}
                disabled={
                  updatingId !== null &&
                  String(updatingId) ===
                    String(getSuggestionId(selectedSuggestion))
                }
                onChange={(event) =>
                  handleStatusChange(selectedSuggestion, event.target.value)
                }
              >
                <option value="pending">Pending</option>

                <option value="reviewing">Reviewing</option>

                <option value="planned">Planned</option>

                <option value="completed">Completed</option>

                <option value="declined">Declined</option>
              </select>

              <button
                type="button"
                className="admin-suggestion-save"
                onClick={handleSaveDetails}
                disabled={savingDetails}
              >
                {savingDetails ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="admin-bugreport-modal-delete"
                onClick={() => handleDelete(selectedSuggestion)}
              >
                Delete Suggestion
              </button>

              <button
                type="button"
                className="admin-bugreport-modal-cancel"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSuggestions;
