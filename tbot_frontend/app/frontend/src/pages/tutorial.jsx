import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/navbar.jsx";

import Footer from "../components/footer.jsx";

import "../css/tutorial.css";

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    eyebrow: "Welcome to Tbot",
    title: "Let's get you oriented.",
    description:
      "Tbot is more than a card database. It connects cards, heroes, community decks, personal decks, collections, profiles, and Discord together.",
    detail:
      "This tutorial will walk you through the main features one step at a time. You can skip around using the dots below, or simply press Next to follow the recommended path.",
    icon: "👋",
  },

  {
    id: "browse",
    eyebrow: "Before you begin",
    title: "Most of Tbot is public.",
    description:
      "You can explore the main databases without creating an account.",
    detail:
      "Decklists, card information, hero information, Keep or Scrap, Legacy Decks, and Deckbuilders can all be explored without logging in. An account is only needed when you want to use personal features.",
    icon: "🔎",
  },

  {
    id: "login",
    eyebrow: "Step 1",
    title: "Log in with Discord",
    description:
      "Your personal Tbot account is connected to your Discord account.",
    detail:
      "Discord login unlocks your dashboard, personal decks, card collection, profile settings, deck sharing, deck suggestions, and other account features.",
    icon: "💬",
  },

  {
    id: "dashboard",
    eyebrow: "Step 2",
    title: "Your dashboard is your control center.",
    description:
      "Once logged in, your dashboard gives you access to your personal Tbot features.",
    detail:
      "From the dashboard you can manage your profile, create personal decks, maintain your card collection, and access other account-related tools.",
    icon: "🏠",
    link: "/dashboard",
    linkText: "Open Dashboard →",
  },

  {
    id: "profile",
    eyebrow: "Step 3",
    title: "Set up your profile.",
    description: "Your profile gives you a public identity on Tbot.",
    detail:
      "You can customize your display name, profile URL, avatar, and bio. Your profile can also provide a central place for other players to find the personal decks you choose to share.",
    icon: "👤",
    link: "/dashboard",
    linkText: "Manage Your Profile →",
  },

  {
    id: "privacy",
    eyebrow: "Step 4",
    title: "Choose Public or Private.",
    description:
      "Your profile visibility controls whether other people can browse your profile.",
    detail:
      "A public profile can be visited by other players. A private profile cannot be publicly browsed, but you can still share individual decks directly with other people.",
    icon: "🔒",
    link: "/dashboard",
    linkText: "Manage Your Profile →",
  },

  {
    id: "personal-decks",
    eyebrow: "Step 5",
    title: "Build your own decks.",
    description:
      "Your dashboard lets you create personal Plants and Zombies decks.",
    detail:
      "Choose a hero, add cards, give the deck a name, and organize your personal deck collection. These decks are yours and are separate from the main community deck database.",
    icon: "🃏",
    link: "/dashboard/decks",
    linkText: "Manage Your Decks →",
  },

  {
    id: "share",
    eyebrow: "Step 6",
    title: "Share individual decks.",
    description:
      "You don't have to make your entire profile public to share a deck.",
    detail:
      "Personal decks can be shared using an individual deck link. This means you can send a specific deck directly to another player even when your profile itself is private.",
    icon: "🔗",
    link: "/dashboard/decks",
    linkText: "View Your Decks →",
  },

  {
    id: "profile-sharing",
    eyebrow: "Step 7",
    title: "Profiles and deck links work differently.",
    description: "A profile link and a deck link are not the same thing.",
    detail:
      "A profile link takes someone to your profile. An individual deck link takes someone directly to a specific deck. Your profile's visibility affects how the profile can be browsed, while individual decks can still be shared directly.",
    icon: "🧭",
    link: "/dashboard",
    linkText: "Manage Your Profile →",
  },

  {
    id: "suggest",
    eyebrow: "Step 8",
    title: "Suggest someone else's deck.",
    description:
      "Found a personal deck that deserves more attention? You can suggest it.",
    detail:
      "Open a community user's profile, select one of their decks, open the deck details, and use the Suggest Deck button. You must be logged in with Discord to submit a suggestion.",
    icon: "⭐",
    link: "/users",
    linkText: "Find Community Users →",
  },

  {
    id: "approval",
    eyebrow: "Step 9",
    title: "Some suggestions require approval.",
    description:
      "A deck suggestion does not necessarily become confirmed immediately.",
    detail:
      "Depending on the situation, the deck creator may need to approve the suggestion through Discord. This gives creators control over suggestions involving their decks.",
    icon: "✅",
  },

  {
    id: "collection",
    eyebrow: "Step 10",
    title: "Add your card collection.",
    description:
      "Tbot can compare the cards you own against the cards required by decks.",
    detail:
      "Open Card Manager from your dashboard and record how many copies of each card you own. You can update your collection whenever it changes.",
    icon: "📚",
    link: "/dashboard/card-manager",
    linkText: "Manage Your Collection →",
  },

  {
    id: "buildable",
    eyebrow: "Step 11",
    title: "Find decks you can build.",
    description:
      "Your collection can be used to identify decks you already have the cards for.",
    detail:
      "Go to the Decklists page and use the Collection filters. Buildable shows decks for which your collection contains the required cards.",
    icon: "🛠️",
    link: "/decklists",
    linkText: "Find Buildable Decks →",
  },

  {
    id: "close",
    eyebrow: "Step 12",
    title: "Find decks you're close to building.",
    description: "You don't need to own every card to find useful decks.",
    detail:
      "The Close filter helps identify decks where you are only missing a small number of cards. These decks can show you what cards might be worth working toward.",
    icon: "🎯",
    link: "/decklists",
    linkText: "Find Decks →",
  },

  {
    id: "decklists",
    eyebrow: "Step 13",
    title: "Use the Decklists database.",
    description:
      "The Decklists page is where you can search and explore community decks.",
    detail:
      "You can narrow the results by side, hero, category, archetype, creator, card, and collection status. Open a deck to see its details and cards.",
    icon: "📋",
    link: "/decklists",
    linkText: "Explore Decklists →",
  },

  {
    id: "cards",
    eyebrow: "Step 14",
    title: "Research individual cards.",
    description: "The Card Information page is your card reference.",
    detail:
      "Search and filter cards by class, cost, attack, health, traits, tribes, set, rarity, and other information. Use it when you want to understand a card or find cards matching specific criteria.",
    icon: "🃏",
    link: "/cardinfo",
    linkText: "Search Cards →",
  },

  {
    id: "heroes",
    eyebrow: "Step 15",
    title: "Learn about heroes.",
    description:
      "The Hero Information page helps you understand what makes each hero unique.",
    detail:
      "Explore hero classes, abilities, traits, stats, and associated cards. This can help when deciding which heroes or deck strategies you want to explore.",
    icon: "🦸",
    link: "/heroinfo",
    linkText: "Explore Heroes →",
  },

  {
    id: "keep-scrap",
    eyebrow: "Step 16",
    title: "Use Keep or Scrap.",
    description: "Not sure what to do with a card in your collection?",
    detail:
      "Keep or Scrap provides class-by-class recommendations to help you decide which cards may be worth keeping and which cards may be candidates for scrapping.",
    icon: "⚖️",
    link: "/keeporscrap",
    linkText: "View Keep or Scrap →",
  },

  {
    id: "legacy",
    eyebrow: "Step 17",
    title: "Explore Legacy Decks.",
    description: "Tbot also preserves an older deck database.",
    detail:
      "Legacy Decks lets you browse older community decklists that are separate from the current deck collection.",
    icon: "📜",
    link: "/legacydecks",
    linkText: "Explore Legacy Decks →",
  },

  {
    id: "deckbuilders",
    eyebrow: "Step 18",
    title: "Find Deckbuilders.",
    description: "You can browse the people who have submitted decks to Tbot.",
    detail:
      "The Deckbuilders section lets you find deckbuilders and explore the decks associated with them.",
    icon: "👥",
    link: "/deckbuilders",
    linkText: "Explore Deckbuilders →",
  },

  {
    id: "community",
    eyebrow: "Step 19",
    title: "Tbot is built around the community.",
    description: "The website and Discord work together.",
    detail:
      "The community is where players can share decks, discuss strategies, report problems, suggest improvements, and interact with the Tbot Discord bot.",
    icon: "🌐",
  },

  {
    id: "finish",
    eyebrow: "You're ready",
    title: "You now know how Tbot fits together.",
    description: "You don't need to memorize everything.",
    detail:
      "Use the website for whatever you need right now. If you forget how a feature works, you can always come back to this tutorial.",
    icon: "🚀",
  },
];

function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const progress = Math.round(
    ((currentStep + 1) / TUTORIAL_STEPS.length) * 100,
  );

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentStep]);

  const goNext = () => {
    if (isLastStep) {
      setCompleted(true);
      return;
    }

    setCurrentStep((previous) => previous + 1);
  };

  const goBack = () => {
    if (isFirstStep) {
      return;
    }

    setCompleted(false);
    setCurrentStep((previous) => previous - 1);
  };

  const restart = () => {
    setCurrentStep(0);
    setCompleted(false);
  };

  return (
    <div className="tutorial-page">
      <Navbar />

      <main className="tutorial-main">
        <div className="tutorial-shell">
          <div className="tutorial-header">
            <div>
              <p className="tutorial-header-eyebrow">Tbot Help</p>

              <h1>How Tbot Works</h1>
            </div>

            <Link className="tutorial-exit-link" to="/">
              Exit Tutorial
            </Link>
          </div>

          {!completed ? (
            <>
              <div
                className="tutorial-progress"
                aria-label={`Step ${currentStep + 1} of ${TUTORIAL_STEPS.length}`}
              >
                <div className="tutorial-progress-top">
                  <span>
                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                  </span>

                  <span>{progress}%</span>
                </div>

                <div className="tutorial-progress-track">
                  <div
                    className="tutorial-progress-bar"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>

              <section className="tutorial-card">
                <div className="tutorial-icon" aria-hidden="true">
                  {step.icon}
                </div>

                <div className="tutorial-content">
                  <p className="tutorial-eyebrow">{step.eyebrow}</p>

                  <h2>{step.title}</h2>

                  <p className="tutorial-description">{step.description}</p>

                  <div className="tutorial-detail">
                    <p>{step.detail}</p>

                    {step.link && (
                      <Link className="tutorial-page-link" to={step.link}>
                        {step.linkText}
                      </Link>
                    )}
                  </div>
                </div>
              </section>

              <div className="tutorial-step-dots">
                {TUTORIAL_STEPS.map((tutorialStep, index) => (
                  <button
                    key={tutorialStep.id}
                    type="button"
                    className={`tutorial-dot ${
                      index === currentStep ? "tutorial-dot-active" : ""
                    } ${index < currentStep ? "tutorial-dot-complete" : ""}`}
                    aria-label={`Go to step ${
                      index + 1
                    }: ${tutorialStep.title}`}
                    aria-current={index === currentStep ? "step" : undefined}
                    onClick={() => {
                      setCompleted(false);
                      setCurrentStep(index);
                    }}
                  />
                ))}
              </div>

              <div className="tutorial-navigation">
                <button
                  type="button"
                  className="tutorial-button tutorial-button-secondary"
                  onClick={goBack}
                  disabled={isFirstStep}
                >
                  ← Back
                </button>

                <button
                  type="button"
                  className="tutorial-button tutorial-button-primary"
                  onClick={goNext}
                >
                  {isLastStep ? "Finish Tutorial" : "Next →"}
                </button>
              </div>
            </>
          ) : (
            <section className="tutorial-complete">
              <div className="tutorial-complete-icon" aria-hidden="true">
                ✓
              </div>

              <p className="tutorial-eyebrow">Tutorial Complete</p>

              <h2>You're ready to use Tbot.</h2>

              <p>
                You now know how the main Tbot features fit together, from
                browsing cards and decks to managing your own profile,
                collection, and personal decks.
              </p>

              <div className="tutorial-complete-actions">
                <Link
                  className="tutorial-button tutorial-button-primary"
                  to="/dashboard"
                >
                  Open Dashboard
                </Link>

                <Link
                  className="tutorial-button tutorial-button-secondary"
                  to="/decklists"
                >
                  Browse Decklists
                </Link>

                <button
                  type="button"
                  className="tutorial-button tutorial-button-ghost"
                  onClick={restart}
                >
                  Restart Tutorial
                </button>
              </div>
            </section>
          )}

          <div className="tutorial-help">
            <p>
              You can revisit this tutorial whenever you need help understanding
              how a Tbot feature works.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Tutorial;
