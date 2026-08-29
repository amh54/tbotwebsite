import "./css/App.css";
import "./css/navbar.css";

import { Link, Route, Routes } from "react-router-dom";

import AdminKeepOrScrap from "./pages/admin-keeporscrap.jsx";
import StandaloneDeckPage from "./pages/standalonedeck.jsx";
import AdminUserDecks from "./pages/admin-userdecks.jsx";
import ScrollToTop from "./components/scrolltotop.jsx";
import Admin from "./pages/admin.jsx";
import DecklistsPage from "./pages/decklists.jsx";
import CardInfo from "./pages/cardinfo.jsx";
import KeepOrScrap from "./pages/keeporscrap.jsx";
import HeroInfo from "./pages/heroinfo.jsx";
import Navbar from "./components/navbar.jsx";
import Footer from "./components/footer.jsx";
import Deckbuilders from "./pages/deckbuilders.jsx";
import DeckbuilderDecks from "./pages/deckbuilderdecks.jsx";
import TermsOfService from "./pages/termsofservice.jsx";
import Privacy from "./pages/privacy.jsx";
import AdminDecklists from "./pages/admin-decklists.jsx";
import Profile from "./pages/profile.jsx";
import LegacyDecksPage from "./pages/legacydecks.jsx";
import AdminLegacyDecks from "./pages/admin-legacydecks.jsx";
import Users from "./pages/users.jsx";
import UserDeckManager from "./pages/userdeckmanager.jsx";
import UserDashboard from "./pages/userdashboard.jsx";
import UserCardManager from "./pages/UserCardManager.jsx";
import AdminCards from "./pages/admincards";
import AdminBugReports from "./pages/adminbugreports.jsx";
import MyBugReports from "./pages/mybugreports.jsx";
import Tutorial from "./pages/tutorial.jsx";

function HomePage() {
  return (
    <div className="home">
      <Navbar />

      {/* ============================================================
          HERO
      ============================================================ */}

      <section className="hero">
        <p className="eyebrow">Plants vs. Zombies Heroes</p>

        <h1>Tbot</h1>

        <h2>A community database for cards, heroes, decks, and strategy.</h2>

        <p>
          Explore cards, discover decks, learn about heroes, and use Tbot's
          tools to get more out of Plants vs. Zombies Heroes.
        </p>
      </section>

      <section className="features">
        <div className="feature-command">
          <h3>New to Tbot?</h3>
          <p>
            
            Tbot has a lot of features. Take the interactive guide to learn how
            profiles, personal decks, card collections, sharing, and other
            features work together.
          </p>
          <Link to="/tutorial"> Take the Tbot Guide → </Link>
        </div>
        <h2>Explore Tbot</h2>

        <p>
          Everything you need to explore the Plants vs. Zombies Heroes community
          in one place.
        </p>

        <div className="feature-grid">
          <div className="feature-command">
            <h3>Decklists</h3>

            <p>
              Browse community decks and search by hero, class, archetype,
              category, creator, card, and more.
            </p>

            <Link to="/decklists">Explore Decklists →</Link>
          </div>

          <div className="feature-command">
            <h3>Card Information</h3>

            <p>
              Search Plant and Zombie cards and explore their stats, abilities,
              traits, sets, and rarities.
            </p>

            <Link to="/cardinfo">Explore Cards →</Link>
          </div>

          <div className="feature-command">
            <h3>Hero Information</h3>

            <p>
              Learn about every hero, including their classes, abilities,
              traits, stats, and cards.
            </p>

            <Link to="/heroinfo">Explore Heroes →</Link>
          </div>

          <div className="feature-command">
            <h3>Keep or Scrap</h3>

            <p>
              Get recommendations to help decide which cards may be worth
              keeping and which may be worth scrapping.
            </p>

            <Link to="/keeporscrap">View Keep or Scrap →</Link>
          </div>

          <div className="feature-command">
            <h3>Legacy Decks</h3>

            <p>
              Browse the older Tbot deck database and explore its historic
              community decklists.
            </p>

            <Link to="/legacydecks">Explore Legacy Decks →</Link>
          </div>

          <div className="feature-command">
            <h3>Deckbuilders</h3>

            <p>
              Find Tbot deckbuilders and explore the decks they have submitted
              to the community.
            </p>

            <Link to="/deckbuilders">Explore Deckbuilders →</Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          DISCORD
      ============================================================ */}

      <section className="discord">
        <h2>Join the Tbot Discord</h2>

        <p>
          Tbot is also connected to a Discord community for Plants vs. Zombies
          Heroes players. Share decks, discuss cards, ask questions, report
          issues, and use the Tbot bot directly from Discord.
        </p>

        <p>
          <a
            href="https://discord.gg/E5XzKf2PjN"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the Tbot Discord →
          </a>
        </p>
      </section>

      {/* ============================================================
          QUICK ANSWERS
      ============================================================ */}

      <section className="quick-answers">
        <h2>Quick Answers</h2>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <h3>What is Tbot?</h3>

            <p>
              Tbot is a Plants vs. Zombies Heroes community website and Discord
              bot focused on cards, heroes, decks, collections, and strategy.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Do I need an account?</h3>

            <p>
              No. You can browse the public card, hero, and deck databases
              without an account. Personal features require Discord login.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Can I contribute?</h3>

            <p>
              Yes. Deck submissions, ideas, corrections, bug reports, and
              feedback are welcome through the Tbot community.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Need help?</h3>

            <p>
              The interactive tutorial explains how the different parts of Tbot
              work together.
            </p>
          </div>
        </div>
      </section>

      <Footer credits="Special thanks to the many PvZ Heroes community members who took time out of their day to give me helpful feedback and critiques before I published this site." />
    </div>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ============================================================
            PUBLIC PAGES
        ============================================================ */}

        <Route path="/" element={<HomePage />} />

        <Route path="/decklists" element={<DecklistsPage />} />

        <Route path="/legacydecks" element={<LegacyDecksPage />} />

        <Route path="/cardinfo" element={<CardInfo />} />

        <Route path="/keeporscrap" element={<KeepOrScrap />} />

        <Route path="/heroinfo" element={<HeroInfo />} />

        <Route path="/termsofservice" element={<TermsOfService />} />

        <Route path="/privacypolicy" element={<Privacy />} />

        <Route path="/users" element={<Users />} />

        <Route path="/deckbuilders" element={<Deckbuilders />} />

        <Route
          path="/deckbuilders/:deckbuilder_name/decks"
          element={<DeckbuilderDecks />}
        />

        {/* ============================================================
            TUTORIAL
        ============================================================ */}

        <Route path="/tutorial" element={<Tutorial />} />

        {/* ============================================================
            PROFILES / SHARED DECKS
        ============================================================ */}

        <Route path="/profile/:profile_slug" element={<Profile />} />

        <Route
          path="/deck/:profile_slug/:deckId"
          element={<StandaloneDeckPage />}
        />

        {/* ============================================================
            USER DASHBOARD
        ============================================================ */}

        <Route path="/dashboard" element={<UserDashboard />} />

        <Route path="/dashboard/decks" element={<UserDeckManager />} />

        <Route path="/dashboard/decks/add" element={<UserDeckManager />} />

        <Route
          path="/dashboard/decks/:deckId/edit"
          element={<UserDeckManager />}
        />

        <Route path="/dashboard/card-manager" element={<UserCardManager />} />

        <Route path="/my-bug-reports" element={<MyBugReports />} />

        {/* ============================================================
            ADMIN
        ============================================================ */}

        <Route path="/admin" element={<Admin />} />

        <Route path="/admin/cards" element={<AdminCards />} />

        <Route path="/admin/bugs" element={<AdminBugReports />} />

        <Route path="/admin/keeporscrap" element={<AdminKeepOrScrap />} />

        <Route path="/admin/decklists" element={<AdminDecklists />} />

        <Route path="/admin/decklist/add" element={<AdminDecklists />} />

        <Route path="/admin/decklists/add" element={<AdminDecklists />} />

        <Route path="/admin/legacy-decks/*" element={<AdminLegacyDecks />} />

        <Route path="/admin/user-decks" element={<AdminUserDecks />} />

        {/* ============================================================
            404
        ============================================================ */}

        <Route
          path="*"
          element={
            <div
              style={{
                padding: "40px",
                color: "#fff",
              }}
            >
              <h1>404</h1>
              <p>Page not found.</p>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
