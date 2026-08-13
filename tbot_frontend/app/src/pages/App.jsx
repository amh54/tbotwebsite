import "../css/App.css";
import { Link, Route, Routes } from "react-router-dom";
import DecklistsPage from "./decklists.jsx";
import CardInformation from "./cardinformation.jsx";
import KeepOrScrap from "./keeporscrap.jsx";
import HeroInformation from "./heroinformation.jsx";

function HomePage() {
  return (
    <div className="home">
      <head>
        <link
          rel="icon"
          href="https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp"
        />
      </head>
      <nav className="navbar">
        <div className="logo">
          <Link to="/">Tbot</Link>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/decklists">Decklists</Link>
          <Link to="/cardinformation">Card Information</Link>
          <Link to="/heroinformation">Hero Information</Link>
          <Link to="/keeporscrap">Keep or Scrap</Link>
        </div>
      </nav>

      <section className="hero">
        <p className="eyebrow">Plants vs. Zombies Heroes</p>
        <h1>Welcome to Tbot</h1>
        <h2>A small companion for decks, cards, and strategy.</h2>

        <p>
          Tbot helps you find deck ideas, check card details, and keep track of
          the things you actually want to remember while you play.
        </p>
      </section>

      <section className="features">
        <h2>What Tbot is for</h2>

        <div className="feature-grid">
          <div className="feature-command">
            <h3>Decks that are easy to browse</h3>
            <p>
              Look through community decklists by hero, style, or name without
              digging through a lot of clutter.
            </p>
          </div>

          <div className="feature-command">
            <h3>Card details when you need them</h3>
            <p>
              Check stats, abilities, and matchups in a simpler way than trying
              to remember everything from memory.
            </p>
          </div>
        </div>
      </section>

      <section className="discord">
        <h2>Join the Discord</h2>
        <p>
          If you use Tbot regularly, the Discord server is the easiest place to
          share ideas, ask questions, and talk decks with other players.
        </p>
        <p>
          <a
            href="https://discord.gg/E5XzKf2PjN"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the Tbot Discord
          </a>
        </p>
      </section>

      <section className="faq">
        <h2>Quick answers</h2>

        <h3>What is Tbot?</h3>
        <p>
          It is a simple companion for Plants vs. Zombies Heroes that helps you
          browse decks and card information from one place.
        </p>

        <h3>How do I use it?</h3>
        <p>
          Use the website for a fuller look at decks and cards, or use the
          Discord bot when you want something quick while playing.
        </p>

        <h3>Can I contribute?</h3>
        <p>Yes. Deck submissions, ideas, and feedback are all welcome.</p>

        <p>
          <a
            href="https://buymeacoffee.com/pvzhtbot"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support Tbot
          </a>
        </p>
      </section>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/decklists" element={<DecklistsPage />} />
      <Route path="/cardinformation" element={<CardInformation />} />
      <Route path="/keeporscrap" element={<KeepOrScrap />} />
      <Route path="/heroinformation" element={<HeroInformation />} />
    </Routes>
  );
}

export default App;
