import { useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/api";

export function useDiscordLoginStatus() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkLogin = async () => {
      setCheckingLogin(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/tbotapp/auth/discord/me/`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setIsLoggedIn(false);
          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const loggedIn =
          data?.authenticated === true ||
          data?.is_authenticated === true ||
          data?.logged_in === true ||
          data?.loggedIn === true ||
          Boolean(data?.discord_id);

        setIsLoggedIn(loggedIn);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Unable to check Discord login status:",
            error,
          );
          setIsLoggedIn(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingLogin(false);
        }
      }
    };

    checkLogin();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoggedIn,
    setIsLoggedIn,
    checkingLogin,
  };
}