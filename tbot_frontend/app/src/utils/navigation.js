const NAVIGATION = [
  {
    label: "Website Info",
    links: [
      { label: "Home", path: "/" },
      { label: "Tutorial", path: "/tutorial" },
      { label: "Site Donations", path: "https://buymeacoffee.com/pvzhtbot" },
      { label: "Site Updates", path: "/updates" },
      { label: "Terms of Service", path: "/termsofservice" },
      { label: "Privacy Policy", path: "/privacypolicy" },
      { label: "Report a Bug", action: "reportBug" },
      {
        label: "Submit a Suggestion",
        action: "suggestion",
      },
    ],
  },
  {
    label: "Community",
    links: [
      { label: "Users", path: "/users" },
      { label: "Discord Server", path: "https://discord.gg/gU53MGSgWA" },
    ],
  },
  {
    label: "Decklists",
    links: [
      { label: "Decklists", path: "/decklists" },
      { label: "Legacy Decks", path: "/legacydecks" },
      { label: "Deckbuilders", path: "/deckbuilders" },
    ],
  },
  {
    label: "Game Info",
    links: [
      { label: "Card Info", path: "/cardinfo" },
      { label: "Hero Info", path: "/heroinfo" },
    ],
  },
  {
    label: "Guides",
    links: [
      { label: "Keep or Scrap", path: "/keeporscrap" },
    ],
  },
];

export default NAVIGATION;