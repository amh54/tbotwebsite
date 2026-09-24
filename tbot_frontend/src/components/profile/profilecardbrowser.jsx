import CardBrowser from "../cardbrowser.jsx";

export default function ProfileCardBrowser({
  cards = [],
  allCards = [],
  profileName,
}) {
  console.log("PROFILE RAW CARDS:", cards);

  return (
    <CardBrowser
      cards={cards}
      profileName={profileName}
      userCollection={true}
      allCards={allCards}
    />
  );
}