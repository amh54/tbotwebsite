import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import CardBrowser from "../components/cardbrowser.jsx";

import "../css/cardinfo.css";
import "../css/navbar.css";
import "../css/loading.css";

export default function CardInfo() {
  return (
    <>
    <Seo
  title="PVZ Heroes Cards - Plants vs. Zombies Heroes Card Database | Tbot"
  description="Browse the complete Plants vs. Zombies Heroes card database on Tbot. Search and filter PVZ Heroes cards by class, type, cost, attack, health, tribe, rarity, set, and abilities."
  canonical="/cardinfo"
/>
      <Navbar />
      <CardBrowser />
      <Footer credits="Special thanks to The_Cute_Chick, otherwise known as TCC, for uploading all of the card images and transcribing most of the initial card information used here." />
    </>
  );
}
