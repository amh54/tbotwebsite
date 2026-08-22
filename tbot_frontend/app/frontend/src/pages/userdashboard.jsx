import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import "../css/userdashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function UserDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/discord/me/`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          navigate("/");
          return;
        }

        const data = await response.json();

        if (!data.authenticated) {
          navigate("/");
          return;
        }

        setAuthenticated(true);
        setUser(data.user || data);
      } catch (error) {
        console.error("Unable to verify user authentication:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [navigate]);

  if (loading) {
    return (
      <div className="user-dashboard-page">
        <main className="user-dashboard-content">
          <div className="user-dashboard-content-header">
            <h1>Checking authentication...</h1>
            <p>Verifying your account.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="user-dashboard-page">
      <main className="user-dashboard-content">
        <div className="user-dashboard-content-header">
          <div>
            <h1>Dashboard</h1>
            <p>Manage your Tbot profile and decks.</p>
          </div>

          <Link to="/" className="user-dashboard-back-button">
            ← Back to Tbot
          </Link>
        </div>

        {user && (
          <div className="user-dashboard-user">
            {user.avatar && (
              <img src={user.avatar} alt="" className="user-dashboard-avatar" />
            )}

            <div>
              <h2>
                {user.username ||
                  user.global_name ||
                  user.first_name ||
                  "Your Account"}
              </h2>

              <p>Manage your personal Tbot content.</p>
            </div>
          </div>
        )}

        <div className="user-dashboard-grid">
          <Link to="/dashboard/decks" className="user-dashboard-card">
            <span className="user-dashboard-card-label">My Decklists</span>

            <span className="user-dashboard-card-action">Manage →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;
