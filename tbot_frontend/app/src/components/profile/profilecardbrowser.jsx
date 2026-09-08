import CardBrowser from "../cardbrowser.jsx";

export default function ProfileCardBrowser({
  cards = [],
  allCards = [],
}) {

  console.log("PROFILE RAW CARDS:", cards);

  return (
    <CardBrowser
      cards={cards}
      userCollection={true}
      allCards={allCards}
    />
  );
}