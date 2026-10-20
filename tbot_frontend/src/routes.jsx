import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/homePage.jsx";
import SuggestionsRoute from "./components/suggestionsRoute.jsx";
import BugReportRoute from "./components/bugReportRoute.jsx";
import MySuggestions from "./pages/profile/mySuggestions.jsx";
import AdminSuggestions from "./pages/admin/adminSuggestions.jsx";
import SiteUpdates from "./pages/webinfo/siteUpdates.jsx";
import AdminKeepOrScrap from "./pages/admin/adminKeepOrScrap.jsx";
import Tutorial from "./pages/webinfo/tutorial.jsx";
import StandaloneDeckPage from "./pages/decks/standAloneDeck.jsx";
import AdminUserDecks from "./pages/admin/adminUserDecks.jsx";
import Admin from "./pages/admin/admin.jsx";
import DecklistsPage from "./pages/decks/decklists.jsx";
import CardInfo from "./pages/gameInfo/cardInfo.jsx";
import KeepOrScrap from "./pages/keepOrScrap.jsx";
import HeroInfo from "./pages/gameInfo/heroInfo.jsx";
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
import DiscordServers from "./pages/discordServers.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/suggestions" element={<SuggestionsRoute />} />
      <Route path="/bugreport" element={<BugReportRoute />} />
      <Route path="/decklists" element={<DecklistsPage />} />
      <Route path="/publicdecks" element={<PublicDecks />} />
      <Route path="/legacydecks" element={<LegacyDecksPage />} />

      <Route path="/cardinfo" element={<CardInfo />} />
      <Route path="/servers" element={<DiscordServers />} />
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
      <Route
        path="/dashboard/decks/:deckId/edit"
        element={<UserDeckManager />}
      />
      <Route path="/dashboard/card-manager" element={<UserCardManager />} />
      <Route path="/my-bug-reports" element={<MyBugReports />} />

      <Route path="/admin/keeporscrap" element={<AdminKeepOrScrap />} />
      <Route path="/admin/updates" element={<AdminUpdates />} />
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
          <div style={{ padding: "40px", color: "#fff" }}>
            <h1>404</h1>
            <p>Page not found.</p>
          </div>
        }
      />
    </Routes>
  );
}
