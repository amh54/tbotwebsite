import { useEffect, useMemo, useState } from "react";

import ReactMarkdown from "react-markdown";

import Navbar from "../components/navbar";

import Footer from "../components/footer";

import Seo from "../components/seo";

import "../css/siteupdates.css";

import { API_BASE_URL } from "../utils/api.js";

const CATEGORY_LABELS = {
  new: "New",
  improvement: "Improvement",
  fix: "Bug Fix",
  data: "Data",
  announcement: "Announcement",
  new_deck: "New Deck",
  deck_update: "Deck Update",
  deleted_deck: "Deleted Deck",
  ui_design: "UI / Design",
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
    .replace(/[_-]+/g, " ")
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
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

function SiteUpdates() {
  const [updates, setUpdates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUpdates = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/tbotapp/site-updates/`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(`Unable to load site updates: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setUpdates(Array.isArray(data) ? data : []);
        }
      } catch (requestError) {
        console.error("Unable to load site updates:", requestError);

        if (!cancelled) {
          setError(
            "We couldn't load the site updates right now. Please try again later.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUpdates();

    return () => {
      cancelled = true;
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

      counts[update.category] = (counts[update.category] || 0) + 1;
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

  return (
    <div className="site-updates-page">
      <Seo
        title="Tbot Site Updates - Plants vs. Zombies Heroes"
        description="See the latest Tbot updates, improvements, bug fixes, and new features for the Plants vs. Zombies Heroes community."
        canonical="/updates"
      />

      <Navbar />

      <main className="site-updates-main">
        <section className="site-updates-hero">
          <div className="site-updates-hero-inner">
            <span className="site-updates-eyebrow">TBOT CHANGELOG</span>

            <h1>Site Updates</h1>

            <p>
              See what's new, what's improved, and what's changed across Tbot.
            </p>
          </div>
        </section>

        <section className="site-updates-content">
          {loading && (
            <div className="site-updates-loading">
              <span className="site-updates-spinner" />
              <span>Loading updates...</span>
            </div>
          )}

          {!loading && error && (
            <div className="site-updates-state site-updates-error">
              <div className="site-updates-state-icon">!</div>

              <h2>Unable to load updates</h2>

              <p>{error}</p>
            </div>
          )}

          {!loading && !error && updates.length === 0 && (
            <div className="site-updates-state">
              <div className="site-updates-state-icon">✓</div>

              <h2>No updates yet</h2>

              <p>
                There aren't any site updates to show right now. Check back
                soon!
              </p>
            </div>
          )}

          {!loading && !error && updates.length > 0 && (
            <>
              <div className="site-updates-filters">
                <div className="site-updates-filter-header">
                  <div>
                    <span className="site-updates-filter-eyebrow">
                      FILTER UPDATES
                    </span>

                    <h2>Browse by category</h2>
                  </div>

                  <span className="site-updates-result-count">
                    {filteredUpdates.length}{" "}
                    {filteredUpdates.length === 1 ? "update" : "updates"}
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
                      onClick={() => setSelectedCategory(category)}
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
                    const categoryClass = normalizeCategoryClass(
                      update.category,
                    );

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

                          <span className="site-update-number">
                            #{update.id}
                          </span>
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
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SiteUpdates;