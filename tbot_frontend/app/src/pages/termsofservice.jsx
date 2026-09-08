import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "../css/termsofservice.css";
import { useEffect } from "react";

const SECTIONS = [
  { id: "about", label: "About Tbot" },
  { id: "website", label: "Website Use" },
  { id: "discord", label: "Discord Bot & Login" },
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
        <header className="terms-page-header">
          <div>
            <span className="terms-page-eyebrow">TBOT WEBSITE</span>

            <h1>Terms of Service</h1>

            <p>Information about using the Tbot website and Discord bot.</p>
          </div>
        </header>

        <div className="terms-layout">
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

          <article className="terms-document">
            <section className="terms-introduction">
              <p>
                These Terms of Service explain the rules and expectations
                surrounding the use of the Tbot website and Discord bot.
              </p>

              <p>
                Tbot is a community-created project for Plants vs. Zombies
                Heroes players. By using Tbot, accessing this website, or
                choosing to authenticate with Discord, you agree to use the
                services responsibly and in accordance with these terms.
              </p>
            </section>

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
                  <li>Discord account authentication</li>
                  <li>Account-specific website features</li>
                </ul>

                <p>
                  Tbot's features may be added, changed, or removed as the
                  project develops.
                </p>
              </div>
            </section>

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
                  Some features of the website may require users to authenticate
                  with Discord. By choosing to use an authenticated feature, you
                  agree to provide accurate information through the
                  authentication process and to use the feature only for its
                  intended purpose.
                </p>

                <p>
                  You agree not to intentionally interfere with the operation of
                  the website, attempt to gain unauthorized access to its
                  systems, bypass access controls or permissions, or use the
                  website in a way that could negatively affect other users.
                </p>
              </div>
            </section>

            <section id="discord" className="terms-section">
              <div className="terms-section-heading">
                <span>03</span>
                <h2>Discord Bot & Login</h2>
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

                <p>
                  Tbot may allow users to authenticate with their Discord
                  account through Discord's authentication services. By choosing
                  to log in with Discord, you authorize Tbot to receive the
                  account information provided by Discord through the
                  authentication process as necessary to identify and
                  authenticate your Tbot account.
                </p>

                <p>
                  Tbot does not receive or store your Discord password through
                  the Discord authentication process.
                </p>

                <p>
                  Authenticated accounts may be used to provide account-specific
                  features, permissions, or other functionality available on the
                  Tbot website.
                </p>

                <p>
                  You are responsible for maintaining control of your Discord
                  account and for any activity performed through an account used
                  to authenticate with Tbot.
                </p>
              </div>
            </section>

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
                  problems, Discord-related issues, authentication service
                  issues, updates, or other circumstances.
                </p>
              </div>
            </section>

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

                <p>
                  By submitting content to Tbot, including decklists,
                  descriptions, or other community information, you represent
                  that you have the right to submit that content and authorize
                  Tbot to store, display, organize, and make it available
                  through its website or Discord features.
                </p>
              </div>
            </section>

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

            <section id="third-party" className="terms-section">
              <div className="terms-section-heading">
                <span>08</span>
                <h2>Third-Party Services</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot may depend on third-party services such as Discord,
                  Discord's authentication services, hosting providers,
                  databases, APIs, or other external services.
                </p>

                <p>
                  When you choose to authenticate with Discord, Tbot uses
                  Discord's authentication services to verify your identity and
                  obtain the account information necessary to provide
                  authenticated Tbot features.
                </p>

                <p>
                  Tbot is not responsible for outages, changes, limitations,
                  security issues, or failures caused by third-party services.
                </p>

                <p>
                  Your use of Discord is also subject to Discord's own terms,
                  policies, and rules. Tbot does not control Discord's services,
                  availability, or policies.
                </p>
              </div>
            </section>

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
                  Users who choose to authenticate with Discord may have limited
                  Discord account information stored by Tbot, such as their
                  Discord user ID and username or display name provided through
                  the authentication process.
                </p>

                <p>
                  This information may be used to authenticate users, associate
                  activity with an account, and provide account-specific
                  functionality or permissions.
                </p>

                <p>
                  Tbot does not receive or store Discord passwords through the
                  authentication process and does not intentionally collect
                  private Discord messages for its normal website or bot
                  functionality.
                </p>

                <p>
                  For more information, please review the{" "}
                  <Link to="/privacypolicy">Privacy Policy</Link>.
                </p>
              </div>
            </section>

            <section id="changes" className="terms-section">
              <div className="terms-section-heading">
                <span>10</span>
                <h2>Changes to Tbot</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  Tbot's features, commands, website pages, database structure,
                  permissions, authentication system, and functionality may
                  change at any time.
                </p>

                <p>
                  The owner of Tbot reserves the right to add, modify, restrict,
                  suspend, or remove features without prior notice.
                </p>

                <p>
                  Access to certain features may also be restricted or removed
                  if necessary to maintain the security or proper operation of
                  Tbot.
                </p>
              </div>
            </section>

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

                <p>
                  Users are also responsible for maintaining the security of the
                  Discord account they use to authenticate with Tbot.
                </p>

                <p>
                  Users must not attempt to access administrative features or
                  permissions that have not been authorized for their account.
                </p>
              </div>
            </section>

            <section id="contact" className="terms-section">
              <div className="terms-section-heading">
                <span>12</span>
                <h2>Contact</h2>
              </div>

              <div className="terms-section-content">
                <p>
                  If you encounter an issue with Tbot, the website, a decklist,
                  Discord authentication, or another feature, you may contact
                  the Tbot owner through the available Tbot Discord community
                  contact methods.
                </p>
              </div>
            </section>

            <footer className="terms-footer">
              <span>Tbot Terms of Service</span>

              <Link to="/privacypolicy">Privacy Policy</Link>
            </footer>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default TermsOfService;
