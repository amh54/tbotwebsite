import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "../css/navbar.css";

const NAVIGATION = [
  {
    label: "Website Info",
    links: [
      { label: "Home", path: "/" },
      { label: "Users", path: "/users" },
      { label: "Terms of Service", path: "/termsofservice" },
      { label: "Privacy Policy", path: "/privacypolicy" },
    ],
  },
  {
    label: "Decklists",
    links: [
      { label: "Decklists", path: "/decklists" },
      { label: "Legacy Decks", path: "/legacydecks" },
      { label: "Deckbuilders", path: "/deckbuilders" },
    ],
  },
  {
    label: "Game Info",
    links: [
      { label: "Card Info", path: "/cardinfo" },
      { label: "Hero Info", path: "/heroinfo" },
    ],
  },
  {
    label: "Guides",
    links: [{ label: "Keep or Scrap", path: "/keeporscrap" }],
  },
];

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
).replace(/\/+$/, "");

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmedCookie.substring(name.length + 1));
    }
  }

  return null;
}

async function ensureCsrfToken() {
  let csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Unable to obtain CSRF token: ${response.status}`);
  }

  csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error("CSRF token was not provided by the server.");
  }

  return csrfToken;
}

function Navbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugCategory, setBugCategory] = useState("other");
  const [bugPriority, setBugPriority] = useState("normal");
  const [bugScreenshot, setBugScreenshot] = useState(null);
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugMessage, setBugMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/auth/discord/me/`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load user: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (data.authenticated && data.user) {
          setUser(data.user);

          try {
            const profileResponse = await fetch(
              `${API_BASE_URL}/tbotapp/profile/me/`,
              {
                method: "GET",
                credentials: "include",
              },
            );

            if (!profileResponse.ok) {
              console.error("Profile request failed:", profileResponse.status);

              if (!cancelled) {
                setProfile(null);
              }

              return;
            }

            const profileData = await profileResponse.json();

            if (!cancelled) {
              setProfile(profileData.profile || null);
            }
          } catch (profileError) {
            console.error("Unable to load user profile:", profileError);

            if (!cancelled) {
              setProfile(null);
            }
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Unable to load Discord user:", error);

        if (!cancelled) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMenu = (label) => {
    setOpenMenu((current) => (current === label ? null : label));
  };

  const toggleMobileSection = (label) => {
    setMobileOpenSection((current) => (current === label ? null : label));
  };

  const closeMenus = () => {
    setOpenMenu(null);
    setMobileOpen(false);
    setMobileOpenSection(null);
  };

  const openMobileMenu = () => {
    setMobileOpen(true);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileOpenSection(null);
  };

  const resetBugReport = () => {
    setBugTitle("");
    setBugDescription("");
    setBugCategory("other");
    setBugPriority("normal");
    setBugScreenshot(null);
    setBugMessage("");
  };

  const openBugReport = () => {
    closeMenus();
    resetBugReport();
    setBugReportOpen(true);
  };

  const closeBugReport = () => {
    if (bugSubmitting) {
      return;
    }

    setBugReportOpen(false);
    resetBugReport();
  };

  const handleBugScreenshotChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setBugScreenshot(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setBugMessage("Please select an image file for the screenshot.");

      event.target.value = "";
      setBugScreenshot(null);

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setBugMessage("Screenshot must be smaller than 10 MB.");

      event.target.value = "";
      setBugScreenshot(null);

      return;
    }

    setBugMessage("");
    setBugScreenshot(file);
  };

  const getOperatingSystem = () => {
    const userAgent = window.navigator.userAgent || "";
    const platform = window.navigator.platform || "";

    if (/Windows/i.test(userAgent) || /Win/i.test(platform)) {
      return "Windows";
    }

    if (/Android/i.test(userAgent)) {
      return "Android";
    }

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return "iOS";
    }

    if (/Macintosh|Mac OS X/i.test(userAgent)) {
      return "macOS";
    }

    if (/Linux/i.test(userAgent) || /Linux/i.test(platform)) {
      return "Linux";
    }

    return "Unknown";
  };

  const getBrowser = () => {
    const userAgent = window.navigator.userAgent || "";

    if (/Edg\//i.test(userAgent)) {
      return "Microsoft Edge";
    }

    if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) {
      return "Opera";
    }

    if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
      return "Google Chrome";
    }

    if (/Firefox\//i.test(userAgent)) {
      return "Mozilla Firefox";
    }

    if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
      return "Safari";
    }

    if (/MSIE|Trident/i.test(userAgent)) {
      return "Internet Explorer";
    }

    return "Unknown";
  };

  const submitBugReport = async (event) => {
    event.preventDefault();

    if (bugSubmitting) {
      return;
    }

    const title = bugTitle.trim();
    const description = bugDescription.trim();

    if (!title) {
      setBugMessage("Please enter a title.");
      return;
    }

    if (!description) {
      setBugMessage("Please enter a description.");
      return;
    }

    if (!user?.id) {
      setBugMessage(
        "You must be logged in with Discord to submit a bug report.",
      );
      return;
    }

    setBugSubmitting(true);
    setBugMessage("");

    try {
      const csrfToken = await ensureCsrfToken();

      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("page_url", window.location.href);
      formData.append("category", bugCategory);
      formData.append("priority", bugPriority);
      formData.append("browser", getBrowser());
      formData.append("operating_system", getOperatingSystem());

      /*
       * These identify the user who submitted the report.
       *
       * The Django backend should still verify these values
       * against the authenticated Discord session.
       */
      formData.append("discord_id", String(user.id));

      formData.append("discord_username", user.username || "");

      if (bugScreenshot) {
        formData.append("screenshot", bugScreenshot);
      }

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/bug-reports/create/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          body: formData,
        },
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || "Unable to submit bug report.",
        );
      }

      setBugMessage("Bug report submitted successfully. Thank you!");

      setBugTitle("");
      setBugDescription("");
      setBugCategory("other");
      setBugPriority("normal");
      setBugScreenshot(null);

      setTimeout(() => {
        setBugReportOpen(false);
        setBugMessage("");
      }, 1200);
    } catch (error) {
      console.error("Unable to submit bug report:", error);

      setBugMessage(error.message || "Unable to submit bug report.");
    } finally {
      setBugSubmitting(false);
    }
  };

  const logoutFromDiscord = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const csrfToken = await ensureCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/tbotapp/auth/discord/logout/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      setUser(null);
      setProfile(null);

      closeMenus();
    } catch (error) {
      console.error("Unable to log out:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const getUserName = () => {
    if (!user) {
      return "";
    }

    return user.first_name || user.username || "Discord User";
  };

  const getUserInitial = () => {
    return getUserName().charAt(0).toUpperCase();
  };

  const profileSlug = profile?.profile_slug || user?.username || null;

  const profilePath = profileSlug
    ? `/profile/${encodeURIComponent(profileSlug)}`
    : null;

  return (
    <>
      <header className="site-navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" onClick={closeMenus}>
            <img
              src="https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp"
              alt="Tbot"
              className="navbar-logo-image"
            />

            <span className="navbar-logo-main">TBOT</span>
          </Link>

          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={openMobileMenu}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className="navbar-links">
            {NAVIGATION.map((menu) => (
              <div
                key={menu.label}
                className={`navbar-dropdown ${
                  openMenu === menu.label ? "open" : ""
                }`}
              >
                <button
                  type="button"
                  className="navbar-dropdown-button"
                  onClick={() => toggleMenu(menu.label)}
                >
                  <span>{menu.label}</span>
                  <span className="navbar-arrow" />
                </button>

                <div className="navbar-dropdown-menu">
                  {menu.links.map((link) => (
                    <Link key={link.path} to={link.path} onClick={closeMenus}>
                      {link.label}
                    </Link>
                  ))}

                  {menu.label === "Website Info" && (
                    <button
                      type="button"
                      className="navbar-dropdown-link-button"
                      onClick={openBugReport}
                    >
                      Report a Bug
                    </button>
                  )}
                </div>
              </div>
            ))}
          </nav>

          <div className="navbar-account">
            {loadingUser ? null : user ? (
              <div className="navbar-user">
                <div
                  className={`navbar-dropdown navbar-profile-dropdown ${
                    openMenu === "profile" ? "open" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="navbar-profile-button"
                    onClick={() => toggleMenu("profile")}
                    aria-expanded={openMenu === "profile"}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${getUserName()}'s Discord avatar`}
                        className="navbar-user-avatar"
                      />
                    ) : (
                      <div className="navbar-user-avatar navbar-user-avatar-fallback">
                        {getUserInitial()}
                      </div>
                    )}

                    <span className="navbar-user-name">{getUserName()}</span>

                    <span className="navbar-arrow" />
                  </button>

                  <div className="navbar-dropdown-menu navbar-profile-menu">
                    {profilePath && (
                      <Link to={profilePath} onClick={closeMenus}>
                        My Profile
                      </Link>
                    )}

                    <Link to="/dashboard" onClick={closeMenus}>
                      User Dashboard
                    </Link>

                    <Link to="/my-bug-reports" onClick={closeMenus}>
                      My Bug Reports
                    </Link>

                    {user.is_owner && (
                      <Link to="/admin" onClick={closeMenus}>
                        Admin
                      </Link>
                    )}

                    <button
                      type="button"
                      className="navbar-profile-logout"
                      onClick={logoutFromDiscord}
                      disabled={loggingOut}
                    >
                      {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <a
                href={`${API_BASE_URL}/tbotapp/auth/discord/login/`}
                className="navbar-discord-login"
              >
                Login with Discord
              </a>
            )}
          </div>
        </div>

        <div className={`navbar-mobile-overlay ${mobileOpen ? "open" : ""}`}>
          <div className="navbar-mobile-header">
            <Link to="/" className="navbar-logo" onClick={closeMenus}>
              <img
                src="https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp"
                alt="Tbot"
                className="navbar-logo-image"
              />

              <span className="navbar-logo-main">TBOT</span>
            </Link>

            <button
              type="button"
              className="navbar-mobile-close"
              onClick={closeMobileMenu}
              aria-label="Close navigation"
            >
              &times;
            </button>
          </div>

          {!loadingUser && (
            <div className="navbar-mobile-account">
              {user ? (
                <>
                  <div className="navbar-mobile-user">
                    {profilePath ? (
                      <Link
                        to={profilePath}
                        className="navbar-mobile-profile"
                        onClick={closeMenus}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${getUserName()}'s Discord avatar`}
                            className="navbar-user-avatar"
                          />
                        ) : (
                          <div className="navbar-user-avatar navbar-user-avatar-fallback">
                            {getUserInitial()}
                          </div>
                        )}

                        <div className="navbar-mobile-user-info">
                          <span className="navbar-mobile-user-label">
                            Logged in as
                          </span>

                          <strong>{getUserName()}</strong>
                        </div>
                      </Link>
                    ) : (
                      <>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${getUserName()}'s Discord avatar`}
                            className="navbar-user-avatar"
                          />
                        ) : (
                          <div className="navbar-user-avatar navbar-user-avatar-fallback">
                            {getUserInitial()}
                          </div>
                        )}

                        <div className="navbar-mobile-user-info">
                          <span className="navbar-mobile-user-label">
                            Logged in as
                          </span>

                          <strong>{getUserName()}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="navbar-mobile-account-links">
                    {profilePath && (
                      <Link to={profilePath} onClick={closeMenus}>
                        My Profile
                      </Link>
                    )}

                    <Link to="/dashboard" onClick={closeMenus}>
                      User Dashboard
                    </Link>

                    <Link to="/my-bug-reports" onClick={closeMenus}>
                      My Bug Reports
                    </Link>

                    {user.is_owner && (
                      <Link to="/admin" onClick={closeMenus}>
                        Admin
                      </Link>
                    )}
                  </div>

                  <button
                    type="button"
                    className="navbar-mobile-logout"
                    onClick={logoutFromDiscord}
                    disabled={loggingOut}
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <a
                  href={`${API_BASE_URL}/tbotapp/auth/discord/login/`}
                  className="navbar-discord-login navbar-discord-login-mobile"
                >
                  Login with Discord
                </a>
              )}
            </div>
          )}

          <nav className="navbar-mobile-links">
            {NAVIGATION.map((menu) => (
              <div
                key={menu.label}
                className={`navbar-mobile-section ${
                  mobileOpenSection === menu.label ? "open" : ""
                }`}
              >
                <button
                  type="button"
                  className="navbar-mobile-section-button"
                  onClick={() => toggleMobileSection(menu.label)}
                >
                  <span>{menu.label}</span>
                  <span className="navbar-arrow" />
                </button>

                <div className="navbar-mobile-section-menu">
                  {menu.links.map((link) => (
                    <Link key={link.path} to={link.path} onClick={closeMenus}>
                      {link.label}
                    </Link>
                  ))}

                  {menu.label === "Website Info" && (
                    <button
                      type="button"
                      className="navbar-mobile-link-button"
                      onClick={openBugReport}
                    >
                      Report a Bug
                    </button>
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </header>

      {bugReportOpen && (
        <div
          className="bug-report-modal-overlay"
          onClick={closeBugReport}
          role="presentation"
        >
          <div
            className="bug-report-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bug-report-modal-title"
          >
            <div className="bug-report-modal-header">
              <div className="bug-report-modal-title-area">
                <div className="bug-report-modal-icon" />

                <div>
                  <span className="bug-report-modal-eyebrow">TBOT SUPPORT</span>

                  <h2 id="bug-report-modal-title">Report a Bug</h2>

                  <p>
                    Found something that isn't working correctly? Give us the
                    details and we'll investigate it.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="bug-report-modal-close"
                onClick={closeBugReport}
                disabled={bugSubmitting}
                aria-label="Close bug report"
              >
                &times;
              </button>
            </div>

            <form className="bug-report-form" onSubmit={submitBugReport}>
              <div className="bug-report-section">
                <div className="bug-report-section-heading">
                  <span>1</span>

                  <div>
                    <h3>What happened?</h3>
                    <p>Tell us what went wrong.</p>
                  </div>
                </div>

                <div className="bug-report-field">
                  <label htmlFor="bug-report-title">
                    Title
                    <span className="bug-report-required">*</span>
                  </label>

                  <input
                    id="bug-report-title"
                    type="text"
                    value={bugTitle}
                    onChange={(event) => setBugTitle(event.target.value)}
                    placeholder="Example: Decklist filter isn't working"
                    maxLength={255}
                    disabled={bugSubmitting}
                    required
                  />

                  <small>Keep it short and descriptive.</small>
                </div>

                <div className="bug-report-field">
                  <label htmlFor="bug-report-description">
                    Description
                    <span className="bug-report-required">*</span>
                  </label>

                  <textarea
                    id="bug-report-description"
                    value={bugDescription}
                    onChange={(event) => setBugDescription(event.target.value)}
                    placeholder="Tell us what happened, what you expected to happen, and the steps needed to reproduce the issue."
                    rows={7}
                    disabled={bugSubmitting}
                    required
                  />

                  <small>Include as much detail as possible.</small>
                </div>
              </div>

              <div className="bug-report-section">
                <div className="bug-report-section-heading">
                  <span>2</span>

                  <div>
                    <h3>Help us categorize it</h3>

                    <p>This helps us determine where the problem belongs.</p>
                  </div>
                </div>

                <div className="bug-report-field-row">
                  <div className="bug-report-field">
                    <label htmlFor="bug-report-category">Category</label>

                    <select
                      id="bug-report-category"
                      value={bugCategory}
                      onChange={(event) => setBugCategory(event.target.value)}
                      disabled={bugSubmitting}
                    >
                      <option value="ui">UI</option>

                      <option value="decklists">Decklists</option>

                      <option value="cards">Cards</option>

                      <option value="account">Account</option>

                      <option value="discord">Discord</option>

                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="bug-report-field">
                    <label htmlFor="bug-report-priority">Priority</label>

                    <select
                      id="bug-report-priority"
                      value={bugPriority}
                      onChange={(event) => setBugPriority(event.target.value)}
                      disabled={bugSubmitting}
                    >
                      <option value="low">Low</option>

                      <option value="normal">Normal</option>

                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bug-report-section">
                <div className="bug-report-section-heading">
                  <span>3</span>

                  <div>
                    <h3>Technical details</h3>

                    <p>Some information is captured automatically.</p>
                  </div>
                </div>

                <div className="bug-report-field">
                  <label htmlFor="bug-report-page-url">Page URL</label>

                  <input
                    id="bug-report-page-url"
                    type="text"
                    value={window.location.href}
                    readOnly
                    disabled={bugSubmitting}
                  />

                  <small>
                    Automatically captured from the page where you opened this
                    report.
                  </small>
                </div>

                <div className="bug-report-field-row">
                  <div className="bug-report-field">
                    <label htmlFor="bug-report-browser">Browser</label>

                    <input
                      id="bug-report-browser"
                      type="text"
                      value={getBrowser()}
                      readOnly
                      disabled={bugSubmitting}
                    />
                  </div>

                  <div className="bug-report-field">
                    <label htmlFor="bug-report-operating-system">
                      Operating System
                    </label>

                    <input
                      id="bug-report-operating-system"
                      type="text"
                      value={getOperatingSystem()}
                      readOnly
                      disabled={bugSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="bug-report-section">
                <div className="bug-report-section-heading">
                  <span>4</span>

                  <div>
                    <h3>Add a screenshot</h3>

                    <p>
                      Screenshots can make visual bugs much easier to diagnose.
                    </p>
                  </div>
                </div>

                <div className="bug-report-upload">
                  <label
                    htmlFor="bug-report-screenshot"
                    className="bug-report-upload-area"
                  >
                    <span className="bug-report-upload-icon">+</span>

                    <span className="bug-report-upload-title">
                      {bugScreenshot
                        ? "Screenshot selected"
                        : "Choose a screenshot"}
                    </span>

                    <span className="bug-report-upload-description">
                      {bugScreenshot
                        ? bugScreenshot.name
                        : "PNG, JPG, WEBP, or another image format"}
                    </span>

                    <span className="bug-report-upload-limit">
                      Maximum file size: 10 MB
                    </span>

                    <input
                      id="bug-report-screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleBugScreenshotChange}
                      disabled={bugSubmitting}
                    />
                  </label>

                  {bugScreenshot && (
                    <div className="bug-report-file-name">
                      <span>Selected file:</span>

                      <strong>{bugScreenshot.name}</strong>
                    </div>
                  )}
                </div>
              </div>

              {user && (
                <div className="bug-report-user-info">
                  <div className="bug-report-user-avatar">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${getUserName()}'s Discord avatar`}
                      />
                    ) : (
                      getUserInitial()
                    )}
                  </div>

                  <div>
                    <span>Report submitted by</span>

                    <strong>{getUserName()}</strong>
                  </div>
                </div>
              )}

              {bugMessage && (
                <div
                  className={`bug-report-message ${
                    bugMessage.includes("successfully") ? "success" : "error"
                  }`}
                  role="alert"
                >
                  <span className="bug-report-message-icon">
                    {bugMessage.includes("successfully") ? "✓" : "!"}
                  </span>

                  <span>{bugMessage}</span>
                </div>
              )}

              <div className="bug-report-actions">
                <button
                  type="button"
                  className="bug-report-cancel"
                  onClick={closeBugReport}
                  disabled={bugSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bug-report-submit"
                  disabled={bugSubmitting}
                >
                  {bugSubmitting ? (
                    <>
                      <span className="bug-report-spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Bug Report
                      <span className="bug-report-submit-arrow">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
