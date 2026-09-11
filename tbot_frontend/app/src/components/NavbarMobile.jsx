import { Link } from "react-router-dom";

function NavbarMobile({
  navigation,
  mobileOpen,
  mobileOpenSection,
  toggleMobileSection,
  closeMenus,
  closeMobileMenu,
  openBugReport,
  account,
}) {
  return (
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

      <div className="navbar-mobile-account">{account}</div>

      <nav className="navbar-mobile-links">
        {navigation.map((menu) => (
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
              {menu.links.map((link) =>
                link.action === "reportBug" ? (
                  <button
                    key={link.label}
                    type="button"
                    className="navbar-mobile-link-button"
                    onClick={openBugReport}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link key={link.path} to={link.path} onClick={closeMenus}>
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default NavbarMobile;