import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import BugReportModal from "./modals/BugReportModal.jsx";

import Seo from "../components/seo.jsx";

import { API_BASE_URL } from "../utils/api";

export default function BugReportRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const initialPageUrl =
    location.state?.from ||
    `${window.location.origin}/`;

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [authResponse, profileResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/tbotapp/auth/discord/me/`, {
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/tbotapp/profile/me/`, {
            credentials: "include",
          }),
        ]);

        const authData = authResponse.ok
          ? await authResponse.json()
          : null;

        const profileData = profileResponse.ok
          ? await profileResponse.json()
          : null;

        if (cancelled) {
          return;
        }

        setUser(authData?.user || authData || null);

        setProfile(
          profileData?.profile_exists
            ? profileData.profile
            : null,
        );
      } catch {
        if (!cancelled) {
          setUser(null);
          setProfile(null);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Seo
        title="Report a Bug - Tbot"
        description="Report bugs and issues with the Tbot Plants vs. Zombies Heroes website."
        canonical="/bugreport"
      />

      <BugReportModal
        open={true}
        user={user}
        profile={profile}
        initialPageUrl={initialPageUrl}
        onClose={() => navigate(-1)}
      />
    </>
  );
}