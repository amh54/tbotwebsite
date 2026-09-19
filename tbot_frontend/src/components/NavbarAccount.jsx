import { Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
function NavbarAccount({
  user,
  profilePath,
  loadingUser,
  loggingOut,
  toggleMenu,
  openMenu,
  closeMenus,
  logoutFromDiscord,
  getUserName,
  getUserInitial,
}) {
  if (loadingUser) {
    return null;
  }

  if (!user) {
    return (
      <a
        href={`${API_BASE_URL}/tbotapp/auth/discord/login/`}
        className="navbar-discord-login"
      >
        Login with Discord
      </a>
    );
  }

  return (
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
          <Link to="/my-suggestions" onClick={closeMenus}>
            My Suggestions
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
  );
}

export function MobileAccount({
  user,
  profilePath,
  loadingUser,
  loggingOut,
  closeMenus,
  logoutFromDiscord,
  getUserName,
  getUserInitial,
}) {
  if (loadingUser) {
    return null;
  }

  if (!user) {
    return (
      <a
        href={`${API_BASE_URL}/tbotapp/auth/discord/login/`}
        className="navbar-discord-login navbar-discord-login-mobile"
      >
        Login with Discord
      </a>
    );
  }

  const userContent = (
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
        <span className="navbar-mobile-user-label">Logged in as</span>
        <strong>{getUserName()}</strong>
      </div>
    </>
  );

  return (
    <div className="navbar-mobile-account">
      <div className="navbar-mobile-user">
        {profilePath ? (
          <Link
            to={profilePath}
            className="navbar-mobile-profile"
            onClick={closeMenus}
          >
            {userContent}
          </Link>
        ) : (
          userContent
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
        <Link to="/my-suggestions" onClick={closeMenus}>
          My Suggestions
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
    </div>
  );
}

export default NavbarAccount;
