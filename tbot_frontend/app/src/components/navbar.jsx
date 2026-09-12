import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "../css/navbar.css";
import SuggestionModal from "../components/modals/suggestionModal.jsx";
import NavbarDesktop from "./NavbarDesktop";
import NavbarMobile from "./NavbarMobile";
import NavbarAccount, { MobileAccount } from "./NavbarAccount";
import BugReportModal from "../components/modals/BugReportModal.jsx";

import { API_BASE_URL, ensureCsrfToken } from "../utils/api";
import NAVIGATION from "../utils/navigation";

function Navbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
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
  const openSuggestion = () => {
    closeMenus();
    setSuggestionOpen(true);
  };

  const closeSuggestion = () => {
    setSuggestionOpen(false);
  };
  const openBugReport = () => {
    closeMenus();
    setBugReportOpen(true);
  };

  const closeBugReport = () => {
    if (loggingOut) {
      return;
    }

    setBugReportOpen(false);
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

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || `Logout failed: ${response.status}`,
        );
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

          <NavbarDesktop
            navigation={NAVIGATION}
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            closeMenus={closeMenus}
            openBugReport={openBugReport}
            openSuggestion={openSuggestion}
            account={
              <NavbarAccount
                user={user}
                profilePath={profilePath}
                loadingUser={loadingUser}
                loggingOut={loggingOut}
                toggleMenu={toggleMenu}
                openMenu={openMenu}
                closeMenus={closeMenus}
                logoutFromDiscord={logoutFromDiscord}
                getUserName={getUserName}
                getUserInitial={getUserInitial}
              />
            }
          />
        </div>

        <NavbarMobile
          navigation={NAVIGATION}
          mobileOpen={mobileOpen}
          mobileOpenSection={mobileOpenSection}
          toggleMobileSection={toggleMobileSection}
          closeMenus={closeMenus}
          closeMobileMenu={closeMobileMenu}
          openBugReport={openBugReport}
          account={
            <MobileAccount
              user={user}
              profilePath={profilePath}
              loadingUser={loadingUser}
              loggingOut={loggingOut}
              closeMenus={closeMenus}
              logoutFromDiscord={logoutFromDiscord}
              getUserName={getUserName}
              getUserInitial={getUserInitial}
            />
          }
        />
      </header>

      <BugReportModal
        open={bugReportOpen}
        user={user}
        profile={profile}
        onClose={closeBugReport}
      />
      <SuggestionModal
        open={suggestionOpen}
        user={user}
        profile={profile}
        onClose={closeSuggestion}
      />
    </>
  );
}

export default Navbar;
