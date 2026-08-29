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
    description: "Your profile is your public identity on Tbot.",
    detail:
      "From your dashboard you can set a display name, choose a profile URL, upload an avatar, and write a bio. Your profile page then becomes the central hub where other players can find you — it lists the personal decks you've chosen to share, so think of it as the storefront for your deckbuilding.",
    icon: "👤",
    link: "/dashboard",
    linkText: "Manage Your Profile →",
  },

  {
    id: "privacy",
    eyebrow: "Step 4",
    title: "Public or private — you decide.",
    description:
      "Your profile's visibility controls who can browse it, but it doesn't limit deck sharing.",
    detail:
      "A public profile can be visited by anyone, who'll see your bio, avatar, and the decks you display on it. A private profile hides that page from public browsing entirely — but you can still hand anyone a link to one of your decks. That's because a profile link and a deck link are different things: a profile link opens your whole profile, while a deck link opens just that one deck, whether your profile is public or private.",
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
      "Choose a hero, add cards, give the deck a name, and organize your personal deck collection. These decks are yours and are separate from the main community deck database — building or editing one never affects the community decklists.",
    icon: "🃏",
    link: "/dashboard/decks",
    linkText: "Manage Your Decks →",
  },

  {
    id: "suggest",
    eyebrow: "Step 6",
    title: "Suggest someone else's deck.",
    description:
      "Found a personal deck that deserves more attention? You can suggest it.",
    detail:
      "Open a community user's profile, select one of their decks, open the deck details, and use the Suggest Deck button. You must be logged in with Discord to submit a suggestion, and suggesting a deck doesn't remove it from the creator's profile.",
    icon: "⭐",
    link: "/users",
    linkText: "Find Community Users →",
  },

  {
    id: "approval",
    eyebrow: "Step 7",
    title: "Some suggestions require approval.",
    description:
      "A deck suggestion does not necessarily become confirmed immediately.",
    detail:
      "Depending on the situation, the deck creator may need to approve the suggestion through Discord. This gives creators control over suggestions involving their decks.",
    icon: "✅",
  },

  {
    id: "collection",
    eyebrow: "Step 8",
    title: "Add your card collection.",
    description: "Your collection is what powers Tbot's buildability tools.",
    detail:
      "Open Card Manager from your dashboard and record how many copies of each card you own. This is a one-time setup you can update any time your collection changes — once it's entered, Tbot can compare it against every community deck.",
    icon: "📚",
    link: "/dashboard/card-manager",
    linkText: "Manage Your Collection →",
  },

  {
    id: "collection-filter",
    eyebrow: "Step 9",
    title: "Use the collection dropdown.",
    description:
      "The Decklists page has a Collection dropdown that puts your collection to work.",
    detail:
      "Once your collection is entered, the Decklists page shows a Collection filter with a few options. All shows every deck, ignoring your collection. Buildable shows only decks where you already own every required card. Close shows decks where you're missing just a small number of cards — useful for figuring out what to work toward next. Switching between these options is the fastest way to go from 'browsing decks' to 'finding a deck I can actually play right now.'",
    icon: "🛠️",
    link: "/decklists",
    linkText: "Try the Collection Filter →",
  },

  {
    id: "explore",
    eyebrow: "Step 10",
    title: "Explore the rest of the databases.",
    description:
      "Decklists, Card Information, and Hero Information are pretty self-explanatory.",
    detail:
      "Decklists lets you search and filter community decks by side, hero, class, archetype, and creator. Card Information lets you look up any card's stats, class, and abilities. Hero Information covers each hero's classes, traits, and abilities. Beyond those, Keep or Scrap gives class-by-class keep/scrap recommendations, Legacy Decks preserves the older deck archive, and Deckbuilders lets you browse decks by the people who made them.",
    icon: "🔎",
    link: "/decklists",
    linkText: "Start Exploring →",
  },

  {
    id: "community",
    eyebrow: "Step 11",
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
