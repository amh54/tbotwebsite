import "../css/privacy.css";
import Navbar from "../components/navbar.jsx";
import { useEffect } from "react";
import Footer from "../components/footer.jsx";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy";

    return () => {
      document.title = "Tbot";
    };
  }, []);

  return (
    <main className="privacy-page">
      <Navbar />

      <section className="privacy-hero">
        <div className="privacy-hero-content">
          <span className="privacy-label">TBOT</span>

          <h1>Privacy Statement</h1>

          <p>
            This Privacy Statement explains what information Tbot stores, why it
            is stored, and how that information is used.
          </p>

          <span className="privacy-updated">Last Updated: August 19, 2026</span>
        </div>
      </section>

      <section className="privacy-content">
        <div className="privacy-layout">
          <aside className="privacy-sidebar">
            <div className="privacy-sidebar-inner">
              <span className="privacy-sidebar-title">Privacy Statement</span>

              <nav>
                <a href="#information">Information We Store</a>
                <a href="#usage">How Information Is Used</a>
                <a href="#not-collected">
                  Information We Do Not Intentionally Collect
                </a>
                <a href="#sharing">Sharing of Information</a>
                <a href="#retention">Data Retention</a>
                <a href="#changes">Changes to This Statement</a>
                <a href="#contact">Contact</a>
              </nav>
            </div>
          </aside>

          <article className="privacy-document">
            {/* ============================================================
                01 — INFORMATION WE STORE
            ============================================================ */}

            <section id="information" className="privacy-section">
              <span className="privacy-section-number">01</span>

              <div>
                <h2>Information We Store</h2>

                <p>
                  Tbot is designed to collect and store a limited amount of
                  information needed to operate the Tbot website, provide
                  Discord authentication, and provide Tbot's deck-related
                  features.
                </p>

                <p>Information stored by Tbot may include:</p>

                <ul>
                  <li>
                    Discord user ID associated with an authenticated account
                  </li>
                  <li>
                    Discord username or display name associated with an
                    authenticated account
                  </li>
                  <li>
                    Information provided by Discord through the authentication
                    process that is necessary to identify an authenticated user
                  </li>
                  <li>Decklists and the cards contained in them</li>
                  <li>Deck names</li>
                  <li>Deck descriptions</li>
                  <li>Hero information associated with a deck</li>
                  <li>
                    The name of the person who submitted or created a deck
                  </li>
                  <li>
                    Other information directly related to organizing and
                    displaying decklists
                  </li>
                </ul>

                <p>
                  Users may also submit updated or improved descriptions for
                  existing decks. These descriptions may be stored so that
                  improved information can be displayed to the community.
                </p>

                <p>
                  Discord authentication is used to identify users when they
                  choose to log in to Tbot. Tbot does not receive or store a
                  user's Discord password through this authentication process.
                </p>
              </div>
            </section>

            {/* ============================================================
                02 — HOW INFORMATION IS USED
            ============================================================ */}

            <section id="usage" className="privacy-section">
              <span className="privacy-section-number">02</span>

              <div>
                <h2>How Information Is Used</h2>

                <p>
                  The information stored by Tbot is used to operate, maintain,
                  and improve Tbot and the Tbot website.
                </p>

                <p>Discord account information may be used to:</p>

                <ul>
                  <li>Authenticate users who choose to log in to Tbot</li>
                  <li>Associate an authenticated account with Tbot activity</li>
                  <li>Provide account-specific features and permissions</li>
                  <li>
                    Help administrators manage authorized Tbot functionality
                  </li>
                </ul>

                <p>Deck information may be used to:</p>

                <ul>
                  <li>Display community decklists</li>
                  <li>Provide deck-related Discord commands</li>
                  <li>Allow users to search for decks</li>
                  <li>Organize and categorize decks</li>
                  <li>Improve existing deck information</li>
                  <li>Develop new deck-related features and commands</li>
                </ul>

                <div className="privacy-note">
                  <strong>Purpose of the data</strong>

                  <p>
                    The information is used to provide Tbot's features,
                    authenticate users, manage authorized functionality, and
                    improve the experience for the Plants vs. Zombies Heroes
                    community. It is not collected for advertising purposes.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================================
                03 — INFORMATION WE DO NOT INTENTIONALLY COLLECT
            ============================================================ */}

            <section id="not-collected" className="privacy-section">
              <span className="privacy-section-number">03</span>

              <div>
                <h2>Information We Do Not Intentionally Collect</h2>

                <p>
                  Tbot does not intentionally collect or store Discord
                  passwords, payment information, or private Discord messages
                  for the purpose of operating its website, authentication, or
                  decklist features.
                </p>

                <p>
                  When users authenticate with Discord, Tbot uses the
                  information provided through Discord's authentication process
                  that is necessary to identify and authenticate the account.
                  Tbot does not receive the user's Discord password.
                </p>

                <p>
                  Tbot's primary purpose is to provide community-created Plants
                  vs. Zombies Heroes deck information and related features. Tbot
                  does not intentionally collect information unrelated to these
                  purposes.
                </p>
              </div>
            </section>

            {/* ============================================================
                04 — SHARING OF INFORMATION
            ============================================================ */}

            <section id="sharing" className="privacy-section">
              <span className="privacy-section-number">04</span>

              <div>
                <h2>Sharing of Information</h2>

                <p>
                  Information stored by Tbot is not sold to advertisers, data
                  brokers, or other third parties.
                </p>

                <p>
                  Deck information may be displayed publicly through Tbot's
                  Discord commands or website because displaying community
                  decklists is one of the primary purposes of the service.
                </p>

                <p>
                  Discord account information used for authentication is not
                  intentionally displayed publicly as part of a user's private
                  account information. Certain account-related information may
                  be visible when necessary for Tbot functionality, such as
                  identifying the creator of a community-submitted deck.
                </p>

                <p>
                  Tbot uses Discord's authentication services to allow users to
                  sign in. Information provided through that authentication
                  process is handled in accordance with the functionality
                  provided by Discord and the Tbot authentication system.
                </p>
              </div>
            </section>

            {/* ============================================================
                05 — DATA RETENTION
            ============================================================ */}

            <section id="retention" className="privacy-section">
              <span className="privacy-section-number">05</span>

              <div>
                <h2>Data Retention</h2>

                <p>
                  Deck information may remain stored as long as it is useful for
                  operating Tbot, maintaining the website, or providing
                  historical and community deck information.
                </p>

                <p>
                  Discord account information may remain stored for as long as
                  it is necessary to provide authentication, account-related
                  functionality, permissions, or other features associated with
                  a user's Tbot account.
                </p>

                <p>
                  Decks and their associated information may be modified or
                  removed when necessary.
                </p>

                <p>
                  Account information may also be removed when it is no longer
                  necessary for Tbot's authentication or account-related
                  functionality, subject to reasonable administrative and
                  technical requirements.
                </p>
              </div>
            </section>

            {/* ============================================================
                06 — CHANGES TO THIS STATEMENT
            ============================================================ */}

            <section id="changes" className="privacy-section">
              <span className="privacy-section-number">06</span>

              <div>
                <h2>Changes to This Privacy Statement</h2>

                <p>
                  This Privacy Statement may be updated as Tbot's features
                  change, as additional functionality is added, or as the way
                  information is handled changes.
                </p>

                <p>
                  When changes are made, the updated version will be published
                  on the Tbot website with a new "Last Updated" date.
                </p>
              </div>
            </section>

            {/* ============================================================
                07 — CONTACT
            ============================================================ */}

            <section id="contact" className="privacy-section">
              <span className="privacy-section-number">07</span>

              <div>
                <h2>Contact</h2>

                <p>
                  If you have questions about this Privacy Statement,
                  information stored by Tbot, or your Tbot account, please
                  contact the Tbot administrator through the appropriate Tbot or
                  community contact method.
                </p>
              </div>
            </section>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Privacy;
