import { useState } from "react";
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

function Navbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState(null);

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

  return (
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

        {/* =========================
             DESKTOP NAVIGATION
        ========================= */}

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
      </div>

      {/* =========================
           MOBILE FULL-SCREEN MENU
      ========================= */}

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
