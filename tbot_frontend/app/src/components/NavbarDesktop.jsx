import { Link } from "react-router-dom";

function NavbarDesktop({
  navigation,
  openMenu,
  toggleMenu,
  closeMenus,
  openBugReport,
  account,
}) {
  return (
    <>
      <nav className="navbar-links">
        {navigation.map((menu) => (
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
              {menu.links.map((link) =>
                link.action === "reportBug" ? (
                  <button
                    key={link.label}
                    type="button"
                    className="navbar-dropdown-link-button"
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

      <div className="navbar-account">{account}</div>
    </>
  );
}

export default NavbarDesktop;