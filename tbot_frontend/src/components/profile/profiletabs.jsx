import { useEffect, useState } from "react";

const ProfileTabs = ({
  activeTab = "cards",
  onTabChange,
  showSavedDecks = false,
}) => {
  const [selectedTab, setSelectedTab] = useState(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

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

      {showSavedDecks && (
        <button
          type="button"
          className={selectedTab === "saved" ? "active" : ""}
          onClick={() => handleTabChange("saved")}
        >
          Saved Decks
        </button>
      )}
    </div>
  );
};

export default ProfileTabs;
