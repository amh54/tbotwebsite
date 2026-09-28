import { useEffect, useSyncExternalStore } from "react";
import { API_BASE_URL } from "../utils/api";

let state = {
  isLoggedIn: false,
  checkingLogin: true,
};

let requestStarted = false;

const listeners = new Set();

function updateState(nextState) {
  state = { ...state, ...nextState };

  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function setIsLoggedIn(value) {
  updateState({ isLoggedIn: Boolean(value) });
}

async function checkLogin() {
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

    if (!response.ok) {
      updateState({ isLoggedIn: false });
      return;
    }

    const data = await response.json();

    const loggedIn =
      data?.authenticated === true ||
      data?.is_authenticated === true ||
      data?.logged_in === true ||
      data?.loggedIn === true ||
      Boolean(data?.discord_id);

    updateState({ isLoggedIn: loggedIn });
  } catch (error) {
    console.error("Unable to check Discord login status:", error);

    updateState({ isLoggedIn: false });
  } finally {
    updateState({ checkingLogin: false });
  }
}

export function useDiscordLoginStatus() {
  const { isLoggedIn, checkingLogin } = useSyncExternalStore(
    subscribe,
    getSnapshot,
  );

  useEffect(() => {
    if (requestStarted) {
      return;
    }

    requestStarted = true;

    checkLogin();
  }, []);

  return {
    isLoggedIn,
    setIsLoggedIn,
    checkingLogin,
  };
}