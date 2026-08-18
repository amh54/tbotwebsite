import React from "react";
import "../css/privacy.css";
import Navbar from "../components/navbar.jsx";

const Privacy = () => {
  return (
    <main className="privacy-page">
          <Navbar />
      {/* Hero */}
      <section className="privacy-hero">
        <div className="privacy-hero-content">
          <span className="privacy-label">TBOT</span>

          <h1>Privacy Statement</h1>

          <p>
            This Privacy Statement explains what information Tbot stores, why it
            is stored, and how that information is used.
          </p>

          <span className="privacy-updated">Last Updated: August 16, 2026</span>
        </div>
      </section>

      {/* Content */}
      <section className="privacy-content">
        <div className="privacy-layout">
          {/* Sidebar */}
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

          {/* Main Statement */}
          <article className="privacy-document">
            <section id="information" className="privacy-section">
              <span className="privacy-section-number">01</span>

              <div>
                <h2>Information We Store</h2>

                <p>
                  Tbot is designed to collect and store a limited amount of
                  information. The primary information stored by Tbot is
                  deck-related information submitted through the bot or website.
                </p>

                <p>This may include:</p>

                <ul>
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
              </div>
            </section>

            <section id="usage" className="privacy-section">
              <span className="privacy-section-number">02</span>

              <div>
                <h2>How Information Is Used</h2>

                <p>
                  The information stored by Tbot is used to operate and improve
                  Tbot and the Tbot website.
                </p>

                <p>For example, deck information may be used to:</p>

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
                    The information is used to provide Tbot's features and
                    improve the experience for the Plants vs. Zombies Heroes
                    community. It is not collected for advertising purposes.
                  </p>
                </div>
              </div>
            </section>

            <section id="not-collected" className="privacy-section">
              <span className="privacy-section-number">03</span>

              <div>
                <h2>Information We Do Not Intentionally Collect</h2>

                <p>
                  Tbot does not intentionally collect sensitive personal
                  information such as passwords, payment information, or private
                  messages for the purpose of operating its decklist features.
                </p>

                <p>
                  Tbot's primary purpose is to store and provide
                  community-created Plants vs. Zombies Heroes deck information.
                </p>
              </div>
            </section>

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
              </div>
            </section>

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
                  Decks and their associated information may be modified or
                  removed when necessary.
                </p>
              </div>
            </section>

            <section id="changes" className="privacy-section">
              <span className="privacy-section-number">06</span>

              <div>
                <h2>Changes to This Privacy Statement</h2>

                <p>
                  This Privacy Statement may be updated as Tbot's features
                  change or as additional functionality is added.
                </p>

                <p>
                  When changes are made, the updated version will be published
                  on the Tbot website with a new "Last Updated" date.
                </p>
              </div>
            </section>

            <section id="contact" className="privacy-section">
              <span className="privacy-section-number">07</span>

              <div>
                <h2>Contact</h2>

                <p>
                  If you have questions about this Privacy Statement or
                  information stored by Tbot, please contact the Tbot
                  administrator through the appropriate Tbot or community
                  contact method.
                </p>
              </div>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
};

export default Privacy;
