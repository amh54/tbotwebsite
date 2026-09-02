import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import Navbar from "../components/navbar";
import Footer from "../components/footer";

import "../css/siteupdates.css";

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
).replace(/\/+$/, "");

const CATEGORY_LABELS = {
  new: "New",
  improvement: "Improvement",
  fix: "Bug Fix",
  data: "Data",
  announcement: "Announcement",
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

function SiteUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUpdates = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/tbotapp/site-updates/`, {
          method: "GET",
          credentials: "include",
        });

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

  return (
    <div className="site-updates-page">
      <Navbar />

      <main className="site-updates-main">
        <section className="site-updates-hero">
          <div className="site-updates-hero-inner">
            <span className="site-updates-eyebrow">TBOT CHANGELOG</span>

            <h1>Site Updates</h1>

            <p>
              See what's new, what's improved, and what we've fixed across Tbot.
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
            <div className="site-updates-list">
              {updates.map((update) => (
                <article
                  key={update.id}
                  className={`site-update-card site-update-${update.category}`}
                >
                  <div className="site-update-card-header">
                    <div className="site-update-meta">
                      <span className="site-update-category">
                        {CATEGORY_LABELS[update.category] ||
                          update.category ||
                          "Update"}
                      </span>

                      {update.published_at && (
                        <time dateTime={update.published_at}>
                          {formatDate(update.published_at)}
                        </time>
                      )}
                    </div>

                    <span className="site-update-number">#{update.id}</span>
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
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SiteUpdates;
