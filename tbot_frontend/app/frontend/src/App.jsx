import "./css/App.css";
import "./css/navbar.css";

import { Link, Route, Routes } from "react-router-dom";

import Admin from "./pages/admin.jsx";
import DecklistsPage from "./pages/decklists.jsx";
import CardInfo from "./pages/cardinfo.jsx";
import KeepOrScrap from "./pages/keeporscrap.jsx";
import HeroInfo from "./pages/heroinfo.jsx";
import Navbar from "./components/navbar.jsx";
import Footer from "./components/footer.jsx";
import TermsOfService from "./pages/termsofservice.jsx";
import Privacy from "./pages/privacy.jsx";
import AdminDecklists from "./pages/admin-decklists.jsx";
import Profile from "./pages/profile.jsx";
import LegacyDecksPage from "./pages/legacydecks.jsx";
import AdminLegacyDecks from "./pages/admin-legacydecks.jsx";

function HomePage() {
  return (
    <div className="home">
      <Navbar />

      <section className="hero">
        <p className="eyebrow">Plants vs. Zombies Heroes</p>

        <h1>Tbot</h1>

        <h2>A community database for cards, heroes, decks, and strategy.</h2>

        <p>
          Tbot brings together the information you need to build decks, research
          cards, learn about heroes, and make better decisions while playing
          Plants vs. Zombies Heroes.
        </p>
      </section>

      <section className="features">
        <div className="feature-grid">
          <div className="feature-command">
            <h3>Decklists</h3>
            <p>
              Browse community decklists and find decks by hero, class,
              archetype, type, name, and other information.
            </p>
            <Link to="/decklists">Explore Decklists →</Link>
          </div>

          <div className="feature-command">
            <h3>Card Information</h3>
            <p>
              Search through Plant and Zombie cards using detailed filters for
              class, cost, attack, health, keywords, tribes, set, and rarity.
            </p>
            <Link to="/cardinfo">Explore Cards →</Link>
          </div>

          <div className="feature-command">
            <h3>Hero Information</h3>
            <p>
              Browse the Plant and Zombie heroes and view their classes,
              abilities, traits, stats, and complete card details.
            </p>
            <Link to="/heroinfo">Explore Heroes →</Link>
          </div>

          <div className="feature-command">
            <h3>Keep or Scrap</h3>
            <p>
              Use class-by-class recommendations to help decide which cards are
              worth keeping and which cards may be worth scrapping.
            </p>
            <Link to="/keeporscrap">View Keep or Scrap →</Link>
          </div>
        </div>
      </section>

      <section className="about">
        <h2>Built for PvZ Heroes players</h2>

        <p>
          Tbot is designed as a central place for Plants vs. Zombies Heroes
          information. Instead of keeping card details, deck ideas, hero
          information, and recommendations in separate places, the website puts
          them together in one searchable database.
        </p>

        <p>
          Whether you're looking for a new deck, checking what a card does,
          comparing heroes, or deciding whether a card is worth keeping, Tbot
          gives you a quick way to find what you're looking for.
        </p>
      </section>

      <section className="discord">
        <h2>Join the Tbot Discord</h2>

        <p>
          Tbot is also connected to a Discord community for Plants vs. Zombies
          Heroes players. Share decks, discuss cards, ask questions, and use the
          Tbot bot directly from Discord.
        </p>

        <p>
          <a
            href="https://discord.gg/E5XzKf2PjN"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the Tbot Discord
          </a>
        </p>
      </section>

      <section className="quick-answers">
        <h2>Quick answers</h2>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <h3>What is Tbot?</h3>
            <p>
              Tbot is a Plants vs. Zombies Heroes community website and Discord
              bot that brings together decklists, card information, hero
              information, and card recommendations.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>What can I find on the website?</h3>
            <p>
              You can browse community decklists, search and filter cards, look
              up heroes, and use the Keep or Scrap section to review card
              recommendations.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Can I contribute?</h3>
            <p>
              Yes. Deck submissions, ideas, corrections, and feedback are
              welcome through the Tbot community Discord.
              <br />
              <a
                href="https://discord.gg/E5XzKf2PjN"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join the Tbot Discord
              </a>
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>How can I support Tbot?</h3>
            <p>
              If you find the website or Discord bot useful, you can help
              support continued development and maintenance through Buy Me a
              Coffee.
            </p>

            <a
              href="https://buymeacoffee.com/pvzhtbot"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support Tbot
            </a>
          </div>
        </div>
      </section>

      <Footer credits="Special thanks to the many PvZ Heroes community members who took time out of their day to give me helpful feedback and critiques before I published this site." />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/decklists" element={<DecklistsPage />} />
      <Route path="/legacydecks" element={<LegacyDecksPage />} />

      <Route path="/cardinfo" element={<CardInfo />} />
      <Route path="/keeporscrap" element={<KeepOrScrap />} />
      <Route path="/heroinfo" element={<HeroInfo />} />

      <Route path="/termsofservice" element={<TermsOfService />} />
      <Route path="/privacypolicy" element={<Privacy />} />

      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/decklists" element={<AdminDecklists />} />

      <Route
        path="/admin/legacy-decks"
        element={<AdminLegacyDecks />}
      />

      <Route
        path="/admin/legacy-decks/add"
        element={<AdminLegacyDecks />}
      />

      <Route path="/profile/:profile_slug" element={<Profile />} />

      <Route
        path="*"
        element={
          <div style={{ padding: "40px", color: "#fff" }}>
            <h1>404</h1>
            <p>Page not found.</p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;