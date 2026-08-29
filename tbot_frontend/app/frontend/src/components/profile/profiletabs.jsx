import { useState } from "react";

const ProfileTabs = ({ activeTab = "cards", onTabChange }) => {
  const [selectedTab, setSelectedTab] = useState(activeTab);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);

    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="profile-tabs" role="tablist">
      <button
        type="button"
        className={selectedTab === "cards" ? "active" : ""}
        onClick={() => handleTabChange("cards")}
      >
        Card Collection
      </button>

      <button
        type="button"
        className={selectedTab === "decks" ? "active" : ""}
        onClick={() => handleTabChange("decks")}
      >
        Personal Decks
      </button>
    </div>
  );
};

export default ProfileTabs;
