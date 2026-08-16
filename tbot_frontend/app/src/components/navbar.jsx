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

  const toggleMenu = (label) => {
    setOpenMenu((current) => (current === label ? null : label));
  };

  const closeMenus = () => {
    setOpenMenu(null);
    setMobileOpen(false);
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
          onClick={() => setMobileOpen((current) => !current)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar-links ${mobileOpen ? "mobile-open" : ""}`}>
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
                onClick={() => {
                  if (window.innerWidth <= 800) {
                    toggleMenu(menu.label);
                  }
                }}
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
    </header>
  );
}

export default Navbar;
