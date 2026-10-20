import { Link } from "react-router-dom";

function NavbarDesktop({
  navigation,
  openMenu,
  toggleMenu,
  closeMenus,
  currentPageUrl,
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
                  className="navbar-dropdown-link"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="navbar-account">{account}</div>
    </>
  );
}

export default NavbarDesktop;
