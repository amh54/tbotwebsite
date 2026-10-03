import { useEffect, useMemo, useState } from "react";

import ReactMarkdown from "react-markdown";

import Footer from "../../components/footer.jsx";

import Seo from "../../components/seo.jsx";

import SiteUpdateModal from "../../components/admin/siteUpdateModal.jsx";

import DeleteSiteUpdateModal from "../../components/admin/deleteSiteUpdateModal.jsx";

import "../../css/webinfo/siteUpdates.css";

import "../../css/admin/adminUpdates.css";

import { API_BASE_URL } from "../../utils/api.js";

const CATEGORY_LABELS = {
  new_feature: "New Feature",
  improvement: "Improvement",
  bug_fix: "Bug Fix",
  data: "Data",
  announcement: "Announcement",
  ui_design: "UI / Design",
  new_deck: "New Deck",
  deck_update: "Deck Update",
  deleted_deck: "Deleted Deck",
  other: "Other",
};

const getCategoryLabel = (category) => {
  if (!category) {
    return "Update";
  }

  if (CATEGORY_LABELS[category]) {
    return CATEGORY_LABELS[category];
  }

  return String(category)
    .replace(/[\_\-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const normalizeCategoryClass = (category) => {
  if (!category) {
    return "unknown";
  }

  return String(category)
    .toLowerCase()
    .replace(/[^a-z0-9\_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

function AdminUpdates() {
  const [updates, setUpdates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUpdate, setDeletingUpdate] = useState(null);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/admin/updates/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "You must be logged in with Discord to access the admin page.",
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Owner permissions are required to access site updates.",
          );
        }

        throw new Error(
          `Unable to load site updates: ${response.status}`,
        );
      }

      const data = await response.json();

      setUpdates(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Unable to load admin site updates:", requestError);

      setError(
        requestError?.message ||
          "We couldn't load the site updates right now. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Admin - Site Updates";

    loadUpdates();

    return () => {
      document.title = "Tbot";
    };
  }, []);

  const availableCategories = useMemo(() => {
    const categories = [
      ...new Set(
        updates
          .map((update) => update.category)
          .filter(
            (category) =>
              category !== null &&
              category !== undefined &&
              String(category).trim() !== "",
          ),
      ),
    ];

    return categories.sort((a, b) =>
      getCategoryLabel(a).localeCompare(getCategoryLabel(b)),
    );
  }, [updates]);

  const categoryCounts = useMemo(() => {
    const counts = {};

    updates.forEach((update) => {
      if (!update.category) {
        return;
      }

      counts[update.category] =
        (counts[update.category] || 0) + 1;
    });

    return counts;
  }, [updates]);

  const filteredUpdates = useMemo(() => {
    if (selectedCategory === "all") {
      return updates;
    }

    return updates.filter(
      (update) => update.category === selectedCategory,
    );
  }, [updates, selectedCategory]);

  const openCreateModal = () => {
    setEditingUpdate(null);
    setShowUpdateModal(true);
  };

  const openEditModal = (update) => {
    setEditingUpdate(update);
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setEditingUpdate(null);
  };

  const handleUpdateComplete = (savedUpdate) => {
    setUpdates((current) => {
      const exists = current.some(
        (update) => update.id === savedUpdate.id,
      );

      if (exists) {
        return current
          .map((update) =>
            update.id === savedUpdate.id ? savedUpdate : update,
          )
          .sort(
            (a, b) =>
              new Date(b.published_at || b.created_at) -
              new Date(a.published_at || a.created_at),
          );
      }

      return [savedUpdate, ...current];
    });

    closeUpdateModal();
  };

  const openDeleteModal = (update) => {
    setDeletingUpdate(update);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUpdate(null);
  };

  const handleDeleteComplete = (deletedId) => {
    setUpdates((current) =>
      current.filter((update) => update.id !== deletedId),
    );

    closeDeleteModal();
  };

  if (loading) {
    return (
      <div className="admin-updates-page">
        <Seo
          title="Manage Site Updates - Tbot"
          description="Manage Tbot site updates."
          canonical="/admin/updates"
          noindex
        />

        <main className="admin-updates-content">
          <div className="admin-updates-topbar">
            <div>
              <h1>Site Updates</h1>
              <p className="admin-updates-subtitle">
                Manage the updates displayed on Tbot.
              </p>
            </div>

            <div className="admin-updates-actions">
              <button
                type="button"
                className="admin-back-button"
                onClick={() => {
                  window.location.href = "/admin";
                }}
              >
                ← Admin
              </button>

              <button
                type="button"
                className="admin-add-button"
                onClick={openCreateModal}
              >
                + New Update
              </button>
            </div>
          </div>

          <div className="admin-updates-loading">
            Loading site updates...
          </div>
        </main>

        <Footer credits />
      </div>
    );
  }

  return (
    <div className="admin-updates-page">
      <Seo
        title="Manage Site Updates - Tbot"
        description="Manage Tbot site updates."
        canonical="/admin/updates"
        noindex
      />

      <main className="admin-updates-content">
        <div className="admin-updates-topbar">
          <div>
            <h1>Site Updates</h1>
            <p className="admin-updates-subtitle">
              Manage the updates displayed on Tbot.
            </p>
          </div>

          <div className="admin-updates-actions">
            <button
              type="button"
              className="admin-back-button"
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              ← Admin
            </button>

            <button
              type="button"
              className="admin-add-button"
              onClick={openCreateModal}
            >
              + New Update
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-error">
            {error}

            <button
              type="button"
              onClick={loadUpdates}
            >
              Try Again
            </button>
          </div>
        )}

        {!error && updates.length === 0 && (
          <div className="site-updates-state">
            <div className="site-updates-state-icon">✓</div>

            <h2>No updates yet</h2>

            <p>
              Create your first site update using the button above.
            </p>

            <button
              type="button"
              className="admin-add-button"
              onClick={openCreateModal}
            >
              + New Update
            </button>
          </div>
        )}

        {!error && updates.length > 0 && (
          <>
            <div className="site-updates-filters">
              <div className="site-updates-filter-header">
                <div>
                  <span className="site-updates-filter-eyebrow">
                    MANAGE UPDATES
                  </span>

                  <h2>Browse by category</h2>
                </div>

                <span className="site-updates-result-count">
                  {filteredUpdates.length}{" "}
                  {filteredUpdates.length === 1
                    ? "update"
                    : "updates"}
                </span>
              </div>

              <div className="site-updates-filter-buttons">
                <button
                  type="button"
                  className={`site-updates-filter ${
                    selectedCategory === "all" ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory("all")}
                >
                  <span>All Updates</span>

                  <span className="site-updates-filter-count">
                    {updates.length}
                  </span>
                </button>

                {availableCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`site-updates-filter ${
                      selectedCategory === category ? "active" : ""
                    }`}
                    onClick={() =>
                      setSelectedCategory(category)
                    }
                  >
                    <span>{getCategoryLabel(category)}</span>

                    <span className="site-updates-filter-count">
                      {categoryCounts[category] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filteredUpdates.length === 0 ? (
              <div className="site-updates-state site-updates-filter-empty">
                <div className="site-updates-state-icon">—</div>

                <h2>No updates in this category</h2>

                <p>
                  There aren't any updates currently available for{" "}
                  <strong>
                    {getCategoryLabel(selectedCategory)}
                  </strong>
                  .
                </p>

                <button
                  type="button"
                  className="site-updates-reset-filter"
                  onClick={() => setSelectedCategory("all")}
                >
                  Show All Updates
                </button>
              </div>
            ) : (
              <div className="site-updates-list">
                {filteredUpdates.map((update) => {
                  const categoryClass =
                    normalizeCategoryClass(update.category);

                  return (
                    <article
                      key={update.id}
                      className={`site-update-card site-update-category-${categoryClass}`}
                    >
                      <div className="site-update-card-header">
                        <div className="site-update-meta">
                          <span className="site-update-category">
                            {getCategoryLabel(update.category)}
                          </span>

                          {update.published_at && (
                            <time dateTime={update.published_at}>
                              {formatDate(update.published_at)}
                            </time>
                          )}
                        </div>

                        <div className="admin-site-update-card-actions">
                          <span
                            className={`admin-site-update-status ${
                              update.published
                                ? "published"
                                : "draft"
                            }`}
                          >
                            {update.published
                              ? "Published"
                              : "Draft"}
                          </span>

                          <span className="site-update-number">
                            #{update.id}
                          </span>
                        </div>
                      </div>

                      <div className="site-update-card-body">
                        <h2>{update.title}</h2>

                        <div className="site-update-content">
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              ),
                            }}
                          >
                            {update.content || ""}
                          </ReactMarkdown>
                        </div>

                        {update.page_url && (
                          <a
                            className="site-update-page-link"
                            href={update.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View related page →
                          </a>
                        )}

                        <div className="admin-site-update-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(update)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              openDeleteModal(update)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer credits />

      <SiteUpdateModal
        open={showUpdateModal}
        update={editingUpdate}
        onClose={closeUpdateModal}
        onComplete={handleUpdateComplete}
      />

      <DeleteSiteUpdateModal
        open={showDeleteModal}
        update={deletingUpdate}
        onClose={closeDeleteModal}
        onComplete={handleDeleteComplete}
      />
    </div>
  );
}

export default AdminUpdates;