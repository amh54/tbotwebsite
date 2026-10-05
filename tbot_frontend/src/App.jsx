import { useEffect, useState } from "react";

import "./css/app.css";
import "./css/navbar.css";
import SuggestionsRoute from "./components/suggestionsRoute.jsx";
import BugReportRoute from "./components/bugReportRoute.jsx";
import Seo from "./components/seo.jsx";
import { Analytics } from "@vercel/analytics/react";
import { Link, Route, Routes } from "react-router-dom";
import MySuggestions from "./pages/profile/mySuggestions.jsx";
import AdminSuggestions from "./pages/admin/adminSuggestions.jsx";
import SiteUpdates from "./pages/webinfo/siteUpdates.jsx";
import AdminKeepOrScrap from "./pages/admin/adminKeepOrScrap.jsx";
import Tutorial from "./pages/webinfo/tutorial.jsx";
import StandaloneDeckPage from "./pages/decks/standAloneDeck.jsx";
import AdminUserDecks from "./pages/admin/adminUserDecks.jsx";
import ScrollToTop from "./components/scrollToTop.jsx";
import Admin from "./pages/admin/admin.jsx";
import DecklistsPage from "./pages/decks/decklists.jsx";
import CardInfo from "./pages/gameInfo/cardInfo.jsx";
import KeepOrScrap from "./pages/keepOrScrap.jsx";
import HeroInfo from "./pages/gameInfo/heroInfo.jsx";
import Navbar from "./components/navbar.jsx";
import Footer from "./components/footer.jsx";
import Deckbuilders from "./pages/decks/deckbuilders.jsx";
import DeckbuilderDecks from "./pages/decks/deckbuilderDecks.jsx";
import TermsOfService from "./pages/webinfo/termsOfService.jsx";
import Privacy from "./pages/webinfo/privacy.jsx";
import AdminDecklists from "./pages/admin/adminDecklists.jsx";
import Profile from "./pages/profile/profile.jsx";
import LegacyDecksPage from "./pages/decks/legacyDecks.jsx";
import AdminLegacyDecks from "./pages/admin/adminLegacyDecks.jsx";
import Users from "./pages/users.jsx";
import UserDeckManager from "./pages/profile/userDeckManager.jsx";
import UserDashboard from "./pages/profile/userDashboard.jsx";
import AdminUpdates from "./pages/admin/adminUpdates.jsx";
import UserCardManager from "./pages/profile/userCardManager.jsx";
import AdminBugReports from "./pages/admin/adminBugReports.jsx";
import MyBugReports from "./pages/profile/myBugReports.jsx";
import PublicDecks from "./pages/decks/publicDecks.jsx";
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
            <div className="grave-content">
              <h3>Decklists</h3>
              <p>
                Browse Tbot’s community deck database by hero, class, archetype,
                category, name, and more. New decks are also tested through
                Tbot’s YouTube and Twitch channels.
              </p>
              <div className="grave-links">
                <Link to="/decklists">Explore Decklists →</Link>
                <a
                  href="https://www.youtube.com/@PVZHTbot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Youtube
                </a>
                <a
                  href="https://www.twitch.tv/pvzhtbot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitch
                </a>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Legacy Decks</h3>
              <p>
                Explore Tbot’s older deck database and browse legacy community
                decks from previous versions of the site.
              </p>
              <div className="grave-links">
                <Link to="/legacydecks">Explore Legacy Decks →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Keep or Scrap</h3>
              <p>
                Not sure which cards are worth keeping? <br />
                View class-by-class recommendations to help decide which cards
                to keep, craft, or scrap.
              </p>
              <div className="grave-links">
                <Link to="/keeporscrap">View Keep or Scrap →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Buildable Decks</h3>
              <p>
                Use your card collection to find decks you can build now or are
                only a few cards away from completing.
              </p>
              <div className="grave-links">
                <Link to="/dashboard/card-manager">
                  Manage Your Collection →
                </Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Upload your Personal Decks</h3>
              <p>
                Log in with Discord to create your profile, and upload personal
                decks.
              </p>
              <div className="grave-links">
                <Link to="/dashboard/decks">Manage Your Decks →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Find Player Decks</h3>
              <p>
                Browse public PVZH players and discover the decks they have uploaded to the website
              </p>
              <div className="grave-links">
                <Link to="/users">Browse Users →</Link>
                <Link to="/users">Browse Public Decks →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Card Information</h3>
              <p>
                Search the card database using filters for class, cost, attack,
                health, keywords, tribes, set, rarity, and more.
              </p>
              <div className="grave-links">
                <Link to="/cardinfo">Explore Cards →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Hero Information</h3>
              <p>
                Explore Plant and Zombie heroes with their classes, abilities,
                traits, stats, and associated cards.
              </p>
              <div className="grave-links">
                <Link to="/heroinfo">Explore Heroes →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Deckbuilders</h3>
              <p>
                Discover Tbot deckbuilders and browse the decks they have
                created and submitted to the community.
              </p>
              <div className="grave-links">
                <Link to="/deckbuilders">Explore Deckbuilders →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Site Updates</h3>
              <p>
                Keep up with new decks, features, improvements, fixes, removals,
                and other changes to the Tbot website.
              </p>
              <div className="grave-links">
                <Link to="/updates">Explore Tbot Updates →</Link>
              </div>
            </div>
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
            <div className="grave-content">
              <h3>Create Your Profile</h3>
              <p>
                Create a personalized profile with your display name, profile
                URL, bio, personal decks, and card collection.
              </p>

              <div className="grave-links">
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
            </div>
          </div>

          <div className="quick-answer-card">
            <div className="grave-content">
              <h3>Public or Private</h3>
              <p>
                Choose whether your profile can be discovered and browsed by
                other players. Private profiles can still share individual decks
                through direct links.
              </p>

              <div className="grave-links">
                {profileSlug ? (
                  <Link to={`/profile/${encodeURIComponent(profileSlug)}`}>
                    Manage Profile Visibility →
                  </Link>
                ) : (
                  <Link to="/dashboard">Create Your Profile →</Link>
                )}
              </div>
            </div>
          </div>

          <div className="quick-answer-card">
            <div className="grave-content">
              <h3>Suggest a Community Deck</h3>
              <p>
                Found a great deck on the public decks page? Suggest it for
                consideration on Tbot’s community decklists.
              </p>

              <div className="grave-links">
                <Link to="/publicdecks">Public Decks →</Link>
                <Link to="/decklists">Community Decklists →</Link>
              </div>
            </div>
          </div>

          <div className="quick-answer-card">
            <div className="grave-content">
              <h3>Share Your Decks</h3>
              <p>
                Upload and manage your personal decks, then share them through
                your profile, direct links, or Discord.
              </p>

              {profileSlug && (
                <div className="grave-links">
                  <Link to={`/profile/${encodeURIComponent(profileSlug)}`}>
                    View Your Decks →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="quick-answers">
        <h2>Quick answers</h2>

        <div className="quick-answer-grid">
          <div className="quick-answer-card">
            <div className="grave-content">
              <h3>What is Tbot?</h3>
              <p>
                Tbot is a Plants vs. Zombies Heroes website and Discord bot
                combining decklists, card and hero information, recommendations,
                personal decks, and collection tools.
              </p>
            </div>
          </div>

          <div className="quick-answer-card">
            <div className="grave-content">
              <h3>Do I need an account?</h3>
              <p>
                No. You can browse the public card, hero, and deck databases
                without an account. Discord login is only required for personal
                features.
              </p>
            </div>
          </div>

          <div className="quick-answer-card">
            <div className="grave-content">
              <h3>Can I contribute?</h3>
              <p>
                Yes. You can contribute through deck submissions, suggestions,
                bug reports, and other community feedback.
              </p>

              <div className="grave-links">
                <a
                  href="https://discord.gg/E5XzKf2PjN"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join the Tbot Discord
                </a>
                <a
                  href="https://pvzhtbot.com/suggestions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Suggestions
                </a>
                <div className="grave-links">
                  <a
                    href="https://pvzhtbot.com/bugreport"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bug Reports
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-answer-card">
            <div className="grave-content">
              <h3>How can I support Tbot?</h3>
              <p>
                Help support Tbot’s continued development through Buy Me a
                Coffee, or follow Tbot on YouTube and Twitch.
              </p>

              <div className="grave-links">
                <a
                  href="https://buymeacoffee.com/pvzhtbot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Support Tbot
                </a>

                <a
                  href="https://www.youtube.com/@PVZHTbot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Youtube
                </a>

                <a
                  href="https://www.twitch.tv/pvzhtbot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitch
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer credits="Special thanks to flowerr for designing the background used on the homepage and the card explanations, along with the many PvZ Heroes community members who took the time to provide helpful feedback and critiques before I published this site." />
    </div>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/suggestions" element={<SuggestionsRoute />} />
        <Route path="/bugreport" element={<BugReportRoute />} />
        <Route path="/decklists" element={<DecklistsPage />} />
        <Route path="/publicdecks" element={<PublicDecks />} />
        <Route path="/legacydecks" element={<LegacyDecksPage />} />

        <Route path="/cardinfo" element={<CardInfo />} />

        <Route path="/keeporscrap" element={<KeepOrScrap />} />

        <Route path="/heroinfo" element={<HeroInfo />} />

        <Route path="/termsofservice" element={<TermsOfService />} />

        <Route path="/privacypolicy" element={<Privacy />} />

        <Route path="/users" element={<Users />} />

        <Route path="/tutorial" element={<Tutorial />} />

        <Route path="/deckbuilders" element={<Deckbuilders />} />
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
        <Route path="/admin/updates" element={<AdminUpdates />} />
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
