import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/seo.jsx";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

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

    void loadProfile();

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
                category, name, and more. New decks are also tested on Tbot’s
                YouTube and Twitch channels.
              </p>
              <div className="grave-links">
                <Link to="/decklists">Browse Decklists →</Link>
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
                Browse the older Tbot deck database, including community decks
                from previous versions of the database.
              </p>
              <div className="grave-links">
                <Link to="/legacydecks">Browse Legacy Decks →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Keep or Scrap</h3>
              <p>
                Not sure which cards are worth keeping? <br />
                Get class-by-class recommendations on which cards to keep,
                craft, or scrap.
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
                Enter your card collection to see which decks you can build now
                or are only a few cards away from completing.
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
              <h3>Upload Your Personal Decks</h3>
              <p>
                Log in with Discord to create a profile and upload your own
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
                Browse public PVZH players and discover the decks they have
                uploaded to the website.
              </p>
              <div className="grave-links">
                <Link to="/users">Browse Users →</Link>
                <Link to="/publicdecks">Browse Public Decks →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Card Information</h3>
              <p>
                Search the card database by class, cost, attack, health,
                keywords, tribes, set, rarity, and more.
              </p>
              <div className="grave-links">
                <Link to="/cardinfo">Search Cards →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Hero Information</h3>
              <p>
                Look up Plant and Zombie heroes, including their classes,
                abilities, traits, stats, and associated cards.
              </p>
              <div className="grave-links">
                <Link to="/heroinfo">View Heroes →</Link>
              </div>
            </div>
          </div>

          <div className="feature-command">
            <div className="grave-content">
              <h3>Deckbuilders</h3>
              <p>
                Meet the deckbuilders behind Tbot and browse the decks they have
                created for the community.
              </p>
              <div className="grave-links">
                <Link to="/deckbuilders">Meet the Deckbuilders →</Link>
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
                <Link to="/updates">See Site Updates →</Link>
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
                Set up a profile with your display name, profile URL, bio,
                personal decks, and card collection.
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
                Choose whether other players can find and browse your profile.
                Even with a private profile, you can still share individual
                decks through direct links.
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
                inclusion in Tbot's community decklists.
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
                Share your decks on your profile with a direct link to Discord.
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
              <h3>Can I help improve Tbot?</h3>
              <p>
                Yes. You can help through deck submissions, suggestions, bug
                reports, and feedback, or by joining the community on Discord.
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
              <h3>Where can I follow Tbot or chip in?</h3>
              <p>
                Follow Tbot on YouTube and Twitch for deck testing, or chip in
                through Buy Me a Coffee to help keep the site running.
              </p>

              <div className="grave-links">
                <a
                  href="https://buymeacoffee.com/pvzhtbot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy Me a Coffee
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
export default HomePage;
