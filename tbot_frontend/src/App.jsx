import { useEffect, useState } from "react";

import "./css/App.css";
import "./css/navbar.css";
import Seo from "./components/seo.jsx";
import { Analytics } from "@vercel/analytics/react";
import { Link, Route, Routes } from "react-router-dom";
import MySuggestions from "./pages/mySuggestions";
import AdminSuggestions from "./pages/adminSuggestions";
import SiteUpdates from "./pages/SiteUpdates.jsx";
import AdminKeepOrScrap from "./pages/admin-keeporscrap.jsx";
import Tutorial from "./pages/tutorial.jsx";
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
import AdminCards from "./pages/admincards.jsx";
import AdminBugReports from "./pages/adminbugreports.jsx";
import MyBugReports from "./pages/mybugreports.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function HomePage() {
  const [profileSlug, setProfileSlug] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/profile/me/`, {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled && data?.profile_exists && data?.profile?.profile_slug) {
          setProfileSlug(data.profile.profile_slug);
        }
      } catch {}
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home">
         <Seo
      title="Tbot - Plants vs. Zombies Heroes Database, Decks & More"
      description="Tbot is a Plants vs. Zombies Heroes community database featuring decks, cards, heroes, deck builders, guides, and more."
      canonical="/"
    />
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

        <section className="tutorial-link">
          <Link to="/tutorial">New to Tbot? Take the Tutorial →</Link>
        </section>
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
            <h3>Legacy Decks</h3>

            <p>
              Explore the older Tbot deck database and browse legacy community
              decklists alongside the current deck collection.
            </p>

            <Link to="/legacydecks">Explore Legacy Decks →</Link>
          </div>

          <div className="feature-command">
            <h3>Keep or Scrap</h3>

            <p>
              Not sure which cards to craft or scrap? Get class-by-class
              recommendations on which cards are worth keeping.
            </p>

            <Link to="/keeporscrap">View Keep or Scrap →</Link>
          </div>

          <div className="feature-command">
            <h3>Buildable Decks</h3>

            <p>
              Log in with Discord and enter your collection in the Card Manager,
              then use the Can build and Close to building filters on any page
              that showcases decklists see the decks you can build now and the
              ones you're only a few cards away from.
            </p>

            <Link to="/dashboard/card-manager">Manage Your Collection →</Link>
          </div>

          <div className="feature-command">
            <h3>Personal Decks and Profiles</h3>

            <p>
              Log in with Discord to upload your own decks, customize your
              profile, and share your creations with other players from your
              profile page.
            </p>

            <Link to="/dashboard/decks">Manage Your Decks →</Link>
          </div>

          <div className="feature-command">
            <h3>Find Player Decks</h3>

            <p>
              Browse and click on Public Tbot users to find the personal
              decklists other players have uploaded. You can also see any cards
              this player has unlocked in plants vs zombies heroes by checking
              out their card collection. <br />
              Make sure your account is on public and not private if you want
              your account to show up here in users page
            </p>

            <Link to="/users">Browse Users →</Link>
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
        <h2>Your Tbot profile</h2>

        <p>
          Log in with Discord to create a profile, upload personal decks, and
          share them with other players. Your personal decks are separate from
          the main community deck database.
        </p>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <h3>Create Your Profile</h3>

            <p>
              Customize your display name, profile URL, and bio. Your profile is
              the home for the personal decks you create and your card
              collection.
            </p>

            {profileSlug ? (
              <Link to={`/profile/${encodeURIComponent(profileSlug)}`}>
                Manage Your Profile →
              </Link>
            ) : (
              <Link to="/dashboard">
                Log in with Discord to Create Your Profile →
              </Link>
            )}
          </div>

          <div className="quick-answer-card">
            <h3>Public or Private</h3>

            <p>
              A public profile lets other players browse your decks. A private
              profile can't be browsed, but every personal deck still has its
              own shareable link. Accounts are set to private on default if you
              want your account to public change that below.
            </p>

            {profileSlug ? (
              <Link to={`/profile/${encodeURIComponent(profileSlug)}`}>
                Manage Profile Visibility →
              </Link>
            ) : (
              <Link to="/dashboard">Create Your Profile →</Link>
            )}
          </div>

          <div className="quick-answer-card">
            <h3>Suggest a Community Deck</h3>

            <p>
              Found a great deck on another player's profile? Log in with
              Discord, open its deck details by clicking on the deck, and use{" "}
              <strong>Suggest Deck</strong> to recommend it for the community
              decklists page <br />
              <Link to="/decklists">Community Decklists →</Link>
            </p>
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
              features such as your card collection, personal decklists, profile
              management, and deck suggestions.
            </p>
          </div>

          <div className="quick-answer-card">
            <h3>Can I contribute?</h3>

            <p>
              Yes. Deck submissions, ideas, corrections, bug reports, deck
              suggestions, and feedback are welcome through the Tbot community.
              <br />
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

      <Footer credits="Special thanks to flowerr for designing the background used here on the homepage and to the many PvZ Heroes community members who took time out of their day to give me helpful feedback and critiques before I published this site." />
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

        <Route path="/tutorial" element={<Tutorial />} />

        <Route path="/deckbuilders" element={<Deckbuilders />} />

        <Route path="/admin/cards" element={<AdminCards />} />
        <Route path="/my-suggestions" element={<MySuggestions />} />
        <Route
          path="/deckbuilders/:deckbuilder_name/decks"
          element={<DeckbuilderDecks />}
        />

        <Route path="/profile/:profile_slug" element={<Profile />} />

        <Route
          path="/deck/:profile_slug/:source_type/:deckId"
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

        <Route path="/updates" element={<SiteUpdates />} />

        <Route path="/admin" element={<Admin />} />

        <Route path="/admin/decklists" element={<AdminDecklists />} />

        <Route path="/admin/decklist/add" element={<AdminDecklists />} />

        <Route path="/admin/decklists/add" element={<AdminDecklists />} />

        <Route path="/admin/legacy-decks/*" element={<AdminLegacyDecks />} />
        <Route path="/admin/suggestions" element={<AdminSuggestions />} />
        <Route path="/admin/user-decks" element={<AdminUserDecks />} />

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
      <Analytics />
    </>
  );
}

export default App;
