import CardBrowser from "../cardBrowser.jsx";

export default function ProfileCardBrowser({
  cards = [],
  allCards = [],
  profileName,
}) {
  return (
    <CardBrowser
      cards={cards}
      allCards={allCards}
      userCollection
      profileName={profileName}
      collectionLayout
    />
  );
}