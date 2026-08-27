import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import "../css/admin.css";

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
).replace(/\/+$/, "");

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
      <main className="admin-content">
        <div className="admin-content-header">
          <div>
            <h1>Dashboard</h1>
            <p>Manage the Tbot website.</p>
          </div>

          <Link to="/" className="admin-back-button">
            ← Back to Tbot
          </Link>
        </div>

        <div className="admin-dashboard-grid">
          <Link to="/admin/cards" className="admin-dashboard-card">
            <span className="admin-card-label">Cards</span>
            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/decklists" className="admin-dashboard-card">
            <span className="admin-card-label">Decklists</span>
            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/legacy-decks" className="admin-dashboard-card">
            <span className="admin-card-label">Legacy Decks</span>
            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/user-decks" className="admin-dashboard-card">
            <span className="admin-card-label">User Decks</span>
            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/keeporscrap" className="admin-dashboard-card">
            <span className="admin-card-label">Keep or Scrap</span>
            <span className="admin-card-action">Manage →</span>
          </Link>

          <Link to="/admin/bugs" className="admin-dashboard-card">
            <span className="admin-card-label">Bug Reports</span>
            <span className="admin-card-action">Manage →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Admin;
