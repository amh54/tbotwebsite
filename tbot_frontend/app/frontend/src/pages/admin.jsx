import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/admin.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tbotapp/admin/check/`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          navigate("/");
          return;
        }

        const data = await response.json();

        if (!data.authorized || !data.is_owner) {
          navigate("/");
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Unable to verify admin permissions:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkOwner();
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin-page">
        <main className="admin-content">
          <div className="admin-content-header">
            <h1>Checking permissions...</h1>
            <p>Verifying owner access.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-title">TBOT</div>
          <div className="admin-subtitle">ADMIN</div>
        </div>

        <nav className="admin-sidebar-nav">
          <Link to="/admin" className="admin-nav-link active">
            Dashboard
          </Link>

          <div className="admin-nav-section">
            <div className="admin-nav-heading">Decklists</div>

            <Link to="/admin/decklists">View all</Link>

            <Link to="/admin/decklists/add">Add deck</Link>
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-heading">Legacy Decks</div>

            <Link to="/admin/legacy-decks">View all</Link>

            <Link to="/admin/legacy-decks/add" className="admin-add-button">
              + Add Legacy Deck
            </Link>
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-heading">Cards</div>

            <Link to="/admin/cards">View all</Link>

            <Link to="/admin/cards/add">Add card</Link>
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-heading">Heroes</div>

            <Link to="/admin/heroes">View all</Link>

            <Link to="/admin/heroes/add">Add hero</Link>
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-heading">Keep or Scrap</div>

            <Link to="/admin/keeporscrap">View all</Link>

            <Link to="/admin/keeporscrap/add">Add entry</Link>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/">← Back to Tbot</Link>
        </div>
      </aside>

      <main className="admin-content">
        <div className="admin-content-header">
          <div>
            <h1>Dashboard</h1>
            <p>Manage the Tbot website.</p>
          </div>
        </div>

        <div className="admin-dashboard-grid">
          <Link to="/admin/decklists" className="admin-dashboard-card">
            <span className="admin-card-label">Decklists</span>

            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/legacy-decks" className="admin-dashboard-card">
            <span className="admin-card-label">Legacy Decks</span>

            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/cards" className="admin-dashboard-card">
            <span className="admin-card-label">Cards</span>

            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/heroes" className="admin-dashboard-card">
            <span className="admin-card-label">Heroes</span>

            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/keeporscrap" className="admin-dashboard-card">
            <span className="admin-card-label">Keep or Scrap</span>

            <span className="admin-card-action">Manage →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Admin;
