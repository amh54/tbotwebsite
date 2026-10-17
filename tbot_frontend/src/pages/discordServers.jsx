import { useEffect, useState } from "react";

import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import Seo from "../components/seo.jsx";

import "../css/discordServers.css";
import "../css/navbar.css";
import "../css/loading.css";

import { API_BASE_URL } from "../utils/api.js";

function DiscordServers() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadServers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/servers/`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load Discord servers.");
        }

        setServers(Array.isArray(data.servers) ? data.servers : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load Discord servers right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadServers();

    return () => controller.abort();
  }, []);

  let serverContent;

  if (loading) {
    serverContent = (
      <output className="discord-servers-status">
        <span className="loading-spinner" aria-hidden="true" />
        <span>Loading Discord servers...</span>
      </output>
    );
  } else if (error) {
    serverContent = (
      <div className="discord-servers-empty" role="alert">
        <h2>Unable to load Discord servers</h2>
        <p>{error}</p>
        <button
          type="button"
          className="discord-servers-retry"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  } else if (servers.length === 0) {
    serverContent = (
      <div className="discord-servers-empty">
        <h2>No Discord servers yet</h2>
        <p>There are currently no Discord communities listed.</p>
      </div>
    );
  } else {
    serverContent = (
      <section
        className="discord-servers-grid"
        aria-label="PvZ Heroes Discord communities"
      >
        {servers.map((server) => {
          const cardContent = (
            <>
              <div className="discord-server-card-header">
                {server.server_icon ? (
                  <img
                    className="discord-server-icon"
                    src={server.server_icon}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="discord-server-icon discord-server-icon-placeholder"
                    aria-hidden="true"
                  >
                    {String(server.name || "?")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <h2>{server.name || "Unnamed Server"}</h2>
              </div>

              <p className="discord-server-description">
                {server.description || "No description available."}
              </p>
            </>
          );

          return server.discord_url ? (
            <a
              className="discord-server-card"
              key={server.id}
              href={server.discord_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Join ${server.name || "Discord server"}`}
            >
              {cardContent}
            </a>
          ) : (
            <article className="discord-server-card" key={server.id}>
              {cardContent}
            </article>
          );
        })}
      </section>
    );
  }

  return (
    <div className="discord-servers-page">
      <Seo
        title="PvZ Heroes Discord Servers | Tbot"
        description="Find PvZ Heroes (PVZH) Discord servers and communities. Explore Plants vs. Zombies Heroes servers for tournaments, deck building, strategy, and connecting with other players."
        canonical="/servers"
      />

      <Navbar />

      <main className="discord-servers-content">
        <header className="discord-servers-header">
          <div>
            <h1>PvZ Heroes Discord Servers</h1>
            <p>
              Discover Plants vs. Zombies Heroes communities, find tournament
              servers, and connect with other players.
            </p>
          </div>
        </header>

        <p className="discord-servers-note">
          New servers are added on a case-by-case basis and must be discussed
          with Tbone before being added. Click on one of the cards below to join
        </p>

        {serverContent}
      </main>

      <Footer/>
    </div>
  );
}

export default DiscordServers;
