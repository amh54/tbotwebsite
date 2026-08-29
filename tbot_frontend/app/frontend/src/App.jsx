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
          cards, learn about heroes, manage your collection, and make better
          decisions while playing Plants vs. Zombies Heroes.
        </p>
      </section>

      <section className="features">
        <div className="feature-grid">
          <div className="feature-command">
            <h3>Decklists</h3>
            <p>
              Browse community decklists and find decks by hero, class,
              archetype, category, name, and other information.
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
              Browse Plant and Zombie heroes and view their classes, abilities,
              traits, stats, and complete card details.
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

          <div className="feature-command">
            <h3>Legacy Decks</h3>
            <p>
              Explore the older Tbot deck database and browse legacy community
              decklists alongside the current deck collection.
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

      <section className="about">
        <h2>Build your own Tbot profile</h2>

        <p>
          Tbot isn't just a database. You can create your own profile, build
          personal decklists, manage your card collection, and share your decks
          with other players.
        </p>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <h3>Personal Decklists</h3>
            <p>
              Create and manage your own Plants and Zombies decks. Add cards,
              choose your hero, organize your decks, and keep your personal deck
              collection in one place.
            </p>
            <Link to="/dashboard/decks">Manage Your Decks →</Link>
          </div>

          <div className="quick-answer-card">
            <h3>Card Collection</h3>
            <p>
              Keep track of the cards you own through your personal collection.
              Once your collection is entered, Tbot can help you identify decks
              you can build and decks that are close to being buildable.
            </p>
            <Link to="/dashboard/card-manager">Manage Your Collection →</Link>
          </div>

          <div className="quick-answer-card">
            <h3>Your Profile</h3>
            <p>
              Customize your profile with a display name, profile URL, avatar,
              and bio. Your profile provides a central place for other players
              to discover your shared decklists.
            </p>
            <Link to="/dashboard">Open Your Dashboard →</Link>
          </div>

          <div className="quick-answer-card">
            <h3>Public or Private</h3>
            <p>
              You control whether your profile is public or private. Public
              profiles can have their decklists viewed through a shareable
              profile page, while private profiles provide a more direct way to
              share individual decks.
            </p>
            <Link to="/dashboard">Manage Your Profile →</Link>
          </div>
        </div>
      </section>

      <section className="about">
        <h2>How the collection system works</h2>

        <p>
          The Card Collection feature is designed to make the deck database more
          useful for players who want to know which decks they can actually
          build.
        </p>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <h3>1. Add Your Cards</h3>
            <p>
              Open the Card Manager from your dashboard and enter the cards you
              currently have in your collection.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>2. Browse Decklists</h3>
            <p>
              Go to the Decklists page and use the Collection filter to find
              decks that match your collection.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>3. Find Buildable Decks</h3>
            <p>
              The Buildable filter shows decks for which your collection
              contains the required cards.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>4. Find Almost-Buildable Decks</h3>
            <p>
              The Close filter helps find decks where you are missing only a
              small number of cards, giving you ideas for what to work toward.
            </p>
          </div>
        </div>
      </section>

      <section className="about">
        <h2>Share your decks</h2>

        <p>
          Every personal deck can be shared with other players. Your profile's
          visibility determines how your shared deck experience works.
        </p>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <h3>Public Profile</h3>
            <p>
              A public profile gives other players access to your profile page,
              where they can browse the decklists you have made available
              through your profile.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Private Profile</h3>
            <p>
              A private profile keeps your profile from being publicly
              browsable. You can still share an individual deck directly with
              someone using its deck link.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Share Individual Decks</h3>
            <p>
              You don't need to make your entire profile public just to share a
              deck. Individual deck links can be sent to other players.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Community Decks</h3>
            <p>
              Personal decks and the main Tbot deck database serve different
              purposes, allowing you to keep your own creations organized while
              still browsing the larger community collection.
            </p>
          </div>
        </div>
      </section>

      <section className="about">
        <h2>Guides and help</h2>

        <p>
          New to Tbot? The website is designed to be useful whether you are
          looking for a single card or building a complete personal collection.
          Here are some of the main things you can do.
        </p>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <h3>Find a Deck</h3>
            <p>
              Use the Decklists filters to narrow decks by side, hero, category,
              archetype, or collection status. You can also search by deck,
              creator, hero, or card.
            </p>
            <Link to="/decklists">Find a Deck →</Link>
          </div>

          <div className="quick-answer-card">
            <h3>Research a Card</h3>
            <p>
              Search the card database to check stats, classes, abilities,
              traits, sets, rarities, and other card information.
            </p>
            <Link to="/cardinfo">Search Cards →</Link>
          </div>

          <div className="quick-answer-card">
            <h3>Learn About Heroes</h3>
            <p>
              Explore each hero's classes, abilities, traits, stats, and cards
              to understand what makes different heroes unique.
            </p>
            <Link to="/heroinfo">Explore Heroes →</Link>
          </div>

          <div className="quick-answer-card">
            <h3>Manage Your Account</h3>
            <p>
              Log in with Discord to access your dashboard, manage your decks,
              maintain your card collection, and customize your profile.
            </p>
            <Link to="/dashboard">Open Dashboard →</Link>
          </div>
        </div>
      </section>

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
              information, card recommendations, personal decks, and collection
              tools.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Do I need an account?</h3>
            <p>
              No. You can browse the public card, hero, and deck databases
              without an account. A Discord login is required for personal
              features such as your card collection, personal decklists, and
              profile management.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Can I contribute?</h3>
            <p>
              Yes. Deck submissions, ideas, corrections, bug reports, and
              feedback are welcome through the Tbot community.
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
    <>
      <ScrollToTop />
      <Routes>
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
        <Route path="/admin/cards" element={<AdminCards />} />
        <Route
          path="/deckbuilders/:deckbuilder_name/decks"
          element={<DeckbuilderDecks />}
        />
        <Route path="/profile/:profile_slug" element={<Profile />} />
        <Route
          path="/deck/:profile_slug/:deckId"
          element={<StandaloneDeckPage />}
        />
        <Route path="/admin/bugs" element={<AdminBugReports />} />
        <Route path="/dashboard" element={<UserDashboard />} />

        <Route path="/dashboard/decks" element={<UserDeckManager />} />

        <Route path="/dashboard/decks/add" element={<UserDeckManager />} />
        <Route path="/admin/keeporscrap" element={<AdminKeepOrScrap />} />
        <Route
          path="/dashboard/decks/:deckId/edit"
          element={<UserDeckManager />}
        />
        <Route path="/dashboard/card-manager" element={<UserCardManager />} />
        <Route path="/my-bug-reports" element={<MyBugReports />} />
        <Route path="/admin" element={<Admin />} />

        <Route path="/admin/decklists" element={<AdminDecklists />} />

        <Route path="/admin/decklist/add" element={<AdminDecklists />} />

        <Route path="/admin/decklists/add" element={<AdminDecklists />} />

        <Route path="/admin/legacy-decks/*" element={<AdminLegacyDecks />} />

        <Route path="/admin/user-decks" element={<AdminUserDecks />} />

        {/* 404 */}
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
