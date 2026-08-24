import CardBrowser from "../cardbrowser.jsx";

export default function ProfileCardBrowser({
  cards = [],
  allCards = [],
}) {
  return (
    <CardBrowser
      cards={cards}
      userCollection={true}
      allCards={allCards}
    />
  );
}