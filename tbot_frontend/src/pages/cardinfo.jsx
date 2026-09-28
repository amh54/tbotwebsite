import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import CardBrowser from "../components/cardbrowser.jsx";
import Seo from "../components/seo.jsx";
import "../css/cardinfo.css";
import "../css/navbar.css";
import "../css/loading.css";

export default function CardInfo() {
  return (
    <>
   <Seo
  title="PVZH Cards - PVZ Heroes Card Database | Tbot"
  description="Browse the complete PVZH card database on Tbot. Search and filter Plants vs. Zombies Heroes cards by class, type, cost, attack, health, tribe, rarity, set, and abilities."
  canonical="/cardinfo"
/>
      <Navbar />
      <CardBrowser />
      <Footer credits="Special thanks to The_Cute_Chick, otherwise known as TCC, for uploading all of the card images and transcribing most of the initial card information used here." />
    </>
  );
}
