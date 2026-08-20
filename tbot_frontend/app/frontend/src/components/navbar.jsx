import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/navbar.css";

const NAVIGATION = [
  {
    label: "Website Info",
    links: [
      { label: "Home", path: "/" },
      { label: "Terms of Service", path: "/termsofservice" },
      { label: "Privacy Policy", path: "/privacypolicy" },
    ],
  },
  {
    label: "Decklists",
    links: [
      { label: "Decklists", path: "/decklists" },
      { label: "Legacy Decks", path: "/legacydecks" },
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function Navbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // ============================================================
  // GET CURRENT DISCORD USER + PROFILE
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/discord/me/`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to load user: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (data.authenticated && data.user) {
          setUser(data.user);

          // ======================================================
          // GET USER PROFILE
          // ======================================================

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

            console.log("PROFILE FROM API:", profileData);

            console.log("PROFILE SLUG:", profileData?.profile_slug);

            if (!cancelled) {
              setProfile(profileData);
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

  // ============================================================
  // NAVIGATION
  // ============================================================

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

  // ============================================================
  // LOGOUT
  // ============================================================

  const logoutFromDiscord = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/discord/logout/`, {
        method: "POST",
        credentials: "include",
      });

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

  // ============================================================
  // USER DISPLAY
  // ============================================================

  const getUserName = () => {
    if (!user) {
      return "";
    }

    return user.first_name || user.username || "Discord User";
  };

  const getUserInitial = () => {
    return getUserName().charAt(0).toUpperCase();
  };

  // ============================================================
  // PROFILE PATH
  // ============================================================

  const profileSlug = profile?.profile_slug || user?.username || null;

  const profilePath = profileSlug
    ? `/profile/${encodeURIComponent(profileSlug)}`
    : null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        {/* ================================================== */}
        {/* LOGO */}
        {/* ================================================== */}

        <Link to="/" className="navbar-logo" onClick={closeMenus}>
          <img
            src="https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp"
            alt="Tbot"
            className="navbar-logo-image"
          />

          <span className="navbar-logo-main">TBOT</span>
        </Link>

        {/* ================================================== */}
        {/* MOBILE BUTTON */}
        {/* ================================================== */}

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

        {/* ================================================== */}
        {/* DESKTOP NAVIGATION */}
        {/* ================================================== */}

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
              </div>
            </div>
          ))}
        </nav>

        {/* ================================================== */}
        {/* DESKTOP ACCOUNT */}
        {/* ================================================== */}

        <div className="navbar-account">
          {loadingUser ? null : user ? (
            <div className="navbar-user">
              {/* MY PROFILE */}

              {user && profilePath && (
                <Link
                  to={profilePath}
                  className="navbar-my-profile-link"
                  onClick={closeMenus}
                >
                  My Profile
                </Link>
              )}

              {/* OWNER ADMIN LINK */}

              {user.is_owner && (
                <Link
                  to="/admin"
                  className="navbar-admin-link"
                  onClick={closeMenus}
                >
                  Admin
                </Link>
              )}

              {/* USER */}

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

              {/* LOGOUT */}

              <button
                type="button"
                className="navbar-logout-button"
                onClick={logoutFromDiscord}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          ) : (
            <a
              href={`${API_BASE_URL}/auth/discord/login/`}
              className="navbar-discord-login"
            >
              Login with Discord
            </a>
          )}
        </div>
      </div>

      {/* ====================================================== */}
      {/* MOBILE MENU */}
      {/* ====================================================== */}

      <div className={`navbar-mobile-overlay ${mobileOpen ? "open" : ""}`}>
        {/* ================================================== */}
        {/* MOBILE HEADER */}
        {/* ================================================== */}

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

        {/* ================================================== */}
        {/* MOBILE USER */}
        {/* ================================================== */}

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

                {/* MY PROFILE */}

                {user && profilePath && (
                  <Link
                    to={profilePath}
                    className="navbar-mobile-profile-link"
                    onClick={closeMenus}
                  >
                    My Profile
                  </Link>
                )}

                {/* OWNER ADMIN LINK */}

                {user.is_owner && (
                  <Link
                    to="/admin"
                    className="navbar-admin-link navbar-admin-link-mobile"
                    onClick={closeMenus}
                  >
                    Admin
                  </Link>
                )}

                {/* LOGOUT */}

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
                href={`${API_BASE_URL}/auth/discord/login/`}
                className="navbar-discord-login navbar-discord-login-mobile"
              >
                Login with Discord
              </a>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* MOBILE NAVIGATION */}
        {/* ================================================== */}

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
              </div>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
