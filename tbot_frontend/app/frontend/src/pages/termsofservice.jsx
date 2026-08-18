import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/termsofservice.css";
import { useEffect } from "react";

const SECTIONS = [
  { id: "about", label: "About Tbot" },
  { id: "website", label: "Website Use" },
  { id: "discord", label: "Discord Bot Use" },
  { id: "availability", label: "Availability" },
  { id: "decklists", label: "Decklists & Community Content" },
  { id: "game", label: "Game Information" },
  { id: "content", label: "Website & Bot Content" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "privacy", label: "Data & Privacy" },
  { id: "changes", label: "Changes to Tbot" },
  { id: "responsibility", label: "Responsibility" },
  { id: "contact", label: "Contact" },
];

function TermsOfService() {
  useEffect(() => {
  document.title = "Terms of Service";
  return () => {
    document.title = "Tbot";
  };
}, []);
  return (
    <div className="terms-page">
      <Navbar />

      <main className="terms-content">
        {/* =========================
            PAGE HEADER
        ========================= */}

        <header className="terms-page-header">
          <div>
            <span className="terms-page-eyebrow">TBOT WEBSITE</span>

            <h1>Terms of Service</h1>

            <p>Information about using the Tbot website and Discord bot.</p>
          </div>
        </header>

        {/* =========================
            MAIN LAYOUT
        ========================= */}

        <div className="terms-layout">
          {/* =========================
              SIDEBAR
          ========================= */}

          <aside className="terms-sidebar">
            <div className="terms-sidebar-title">
              <span>ON THIS PAGE</span>
            </div>

            <nav className="terms-sidebar-nav">
              {SECTIONS.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  <span className="terms-sidebar-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span>{section.label}</span>
                </a>
              ))}
            </nav>

            <div className="terms-sidebar-links">
              <Link to="/privacypolicy">Privacy Policy</Link>
            </div>
          </aside>

          {/* =========================
              DOCUMENT
          ========================= */}

          <article className="terms-document">
            {/* =========================
                INTRODUCTION
            ========================= */}

            <section className="terms-introduction">
              <p>
                These Terms of Service explain the rules and expectations
                surrounding the use of the Tbot website and Discord bot.
              </p>

              <p>
                Tbot is a community-created project for Plants vs. Zombies
                Heroes players. By using Tbot or accessing this website, you
                agree to use the services responsibly and in accordance with
                these terms.
              </p>
            </section>

            {/* =========================
                ABOUT
            ========================= */}

            <section id="about" className="terms-section">
              <div className="terms-section-heading">
                <span>01</span>
                <h2>About Tbot</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot is a community-created Discord bot and website designed
                  to provide information, tools, and resources for the Plants
                  vs. Zombies Heroes community.
                </p>

                <p>Features may include:</p>

                <ul>
                  <li>Plants vs. Zombies Heroes decklists</li>
                  <li>Card information and descriptions</li>
                  <li>Hero information</li>
                  <li>Deck searching and browsing</li>
                  <li>Keep or Scrap and other guides</li>
                  <li>Random deck and utility commands</li>
                  <li>Games and miscellaneous entertainment features</li>
                </ul>

                <p>
                  Tbot's features may be added, changed, or removed as the
                  project develops.
                </p>
              </div>
            </section>

            {/* =========================
                WEBSITE
            ========================= */}

            <section id="website" className="terms-section">
              <div className="terms-section-heading">
                <span>02</span>
                <h2>Website Use</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  The Tbot website is provided as a resource for the Plants vs.
                  Zombies Heroes community. You may use the website to browse
                  decklists, card information, hero information, guides, and
                  other available content.
                </p>

                <p>
                  You agree not to intentionally interfere with the operation of
                  the website, attempt to gain unauthorized access to its
                  systems, or use the website in a way that could negatively
                  affect other users.
                </p>
              </div>
            </section>

            {/* =========================
                DISCORD
            ========================= */}

            <section id="discord" className="terms-section">
              <div className="terms-section-heading">
                <span>03</span>
                <h2>Discord Bot Use</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot is designed to operate within Discord servers. Server
                  owners and administrators are responsible for deciding whether
                  Tbot is appropriate for their server.
                </p>

                <p>
                  Server administrators are responsible for managing their
                  channels, roles, permissions, and moderation settings.
                </p>

                <p>
                  If you do not want members using Tbot commands in a particular
                  channel, you are responsible for restricting access to that
                  channel or configuring your server's permissions accordingly.
                </p>

                <p>
                  Tbot does not require administrator permissions for its normal
                  operation. Required permissions may change as new features are
                  introduced.
                </p>
              </div>
            </section>

            {/* =========================
                AVAILABILITY
            ========================= */}

            <section id="availability" className="terms-section">
              <div className="terms-section-heading">
                <span>04</span>
                <h2>Availability</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot and the Tbot website are provided on an "as is" and "as
                  available" basis.
                </p>

                <p>
                  While reasonable efforts may be made to keep the services
                  operational, uninterrupted availability is not guaranteed.
                </p>

                <p>
                  The website or bot may become unavailable because of
                  maintenance, technical problems, hosting issues, database
                  problems, Discord-related issues, updates, or other
                  circumstances.
                </p>
              </div>
            </section>

            {/* =========================
                DECKLISTS
            ========================= */}

            <section id="decklists" className="terms-section">
              <div className="terms-section-heading">
                <span>05</span>
                <h2>Decklists & Community Content</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot contains decklists and other information intended to help
                  members of the Plants vs. Zombies Heroes community.
                </p>

                <p>
                  Decklists are provided for informational and entertainment
                  purposes. Tbot does not guarantee that a particular deck will
                  be effective, competitive, affordable, or appropriate for
                  every player.
                </p>

                <p>
                  Decklists and other community information may be updated,
                  corrected, reorganized, or removed at any time.
                </p>
              </div>
            </section>

            {/* =========================
                GAME INFORMATION
            ========================= */}

            <section id="game" className="terms-section">
              <div className="terms-section-heading">
                <span>06</span>
                <h2>Game Information</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot may display card information, hero information,
                  descriptions, images, and other Plants vs. Zombies Heroes
                  related material.
                </p>

                <p>
                  Tbot is an independent community project and is not affiliated
                  with, sponsored by, or endorsed by Electronic Arts, PopCap
                  Games, or other owners of Plants vs. Zombies Heroes
                  intellectual property unless explicitly stated.
                </p>

                <p>
                  Plants vs. Zombies, Plants vs. Zombies Heroes, related names,
                  characters, artwork, and other intellectual property remain
                  the property of their respective owners.
                </p>
              </div>
            </section>

            {/* =========================
                CONTENT
            ========================= */}

            <section id="content" className="terms-section">
              <div className="terms-section-heading">
                <span>07</span>
                <h2>Website & Bot Content</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  The Tbot project may contain original code, database
                  structures, written content, organization, formatting, guides,
                  and other material created for the project.
                </p>

                <p>
                  You may use the website and bot for their intended purposes.
                  You may not intentionally copy, redistribute, republish, or
                  reproduce substantial portions of Tbot's original website,
                  code, database, or original content without permission.
                </p>
              </div>
            </section>

            {/* =========================
                THIRD PARTY
            ========================= */}

            <section id="third-party" className="terms-section">
              <div className="terms-section-heading">
                <span>08</span>
                <h2>Third-Party Services</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot may depend on third-party services such as Discord,
                  hosting providers, databases, APIs, or other external
                  services.
                </p>

                <p>
                  Tbot is not responsible for outages, changes, limitations, or
                  failures caused by third-party services.
                </p>

                <p>
                  Your use of Discord is also subject to Discord's own terms and
                  policies.
                </p>
              </div>
            </section>

            {/* =========================
                PRIVACY
            ========================= */}

            <section id="privacy" className="terms-section">
              <div className="terms-section-heading">
                <span>09</span>
                <h2>Data & Privacy</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot is designed to collect and store only information
                  necessary to provide its features.
                </p>

                <p>
                  Information associated with decklists may include deck names,
                  deck contents, creators, costs, and other information related
                  to the deck.
                </p>

                <p>
                  Tbot does not intentionally collect unnecessary personal
                  information through its normal decklist functionality.
                </p>

                <p>
                  For more information, please review the{" "}
                  <Link to="/privacypolicy">Privacy Policy</Link>.
                </p>
              </div>
            </section>

            {/* =========================
                CHANGES
            ========================= */}

            <section id="changes" className="terms-section">
              <div className="terms-section-heading">
                <span>10</span>
                <h2>Changes to Tbot</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot's features, commands, website pages, database structure,
                  permissions, and functionality may change at any time.
                </p>

                <p>
                  The owner of Tbot reserves the right to add, modify, restrict,
                  suspend, or remove features without prior notice.
                </p>
              </div>
            </section>

            {/* =========================
                RESPONSIBILITY
            ========================= */}

            <section id="responsibility" className="terms-section">
              <div className="terms-section-heading">
                <span>11</span>
                <h2>Responsibility</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  The owner and maintainer of Tbot are not responsible for
                  damage, loss, disruption, or other issues resulting from the
                  use of, or inability to use, Tbot or the Tbot website.
                </p>

                <p>
                  Server administrators are responsible for managing their own
                  Discord servers, channels, roles, permissions, and moderation
                  policies.
                </p>

                <p>
                  Users are responsible for how they use information provided by
                  Tbot, including decklists, card information, and guides.
                </p>
              </div>
            </section>

            {/* =========================
                CONTACT
            ========================= */}

            <section id="contact" className="terms-section">
              <div className="terms-section-heading">
                <span>12</span>
                <h2>Contact</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  If you encounter an issue with Tbot, the website, a decklist,
                  or another feature, you may contact the Tbot owner through the
                  available Tbot Discord community contact methods.
                </p>
              </div>
            </section>

            {/* =========================
                FOOTER
            ========================= */}

            <footer className="terms-footer">
              <span>Tbot Terms of Service</span>

              <Link to="/privacypolicy">Privacy Policy</Link>
            </footer>
          </article>
        </div>
      </main>
    </div>
  );
}

export default TermsOfService;
