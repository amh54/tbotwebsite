import { Link } from "react-router-dom";

function NavbarMobile({
  navigation,
  mobileOpen,
  mobileOpenSection,
  toggleMobileSection,
  closeMenus,
  currentPageUrl,
  closeMobileMenu,
  account,
}) {
  return (
    <div className={`navbar-mobile-overlay ${mobileOpen ? "open" : ""}`}>
      <div className="navbar-mobile-header">
        <Link to="/" className="navbar-logo" onClick={closeMenus}>
          <img
            src="https://cdn.pvzhtbot.com/art/halloween.webp"
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
              {menu.links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  state={
                    ["/bugreport", "/suggestions"].includes(link.path)
                      ? { from: currentPageUrl }
                      : undefined
                  }
                  onClick={closeMenus}
                  className="navbar-mobile-link-button"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default NavbarMobile;
