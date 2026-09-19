import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import CardBrowser from "../components/cardbrowser.jsx";

import "../css/cardinfo.css";
import "../css/navbar.css";
import "../css/loading.css";

export default function CardInfo() {
  return (
    <>
      <Navbar />
      <CardBrowser />
      <Footer credits="Special thanks to The_Cute_Chick, otherwise known as TCC, for uploading all of the card images and transcribing most of the initial card information used here." />
    </>
  );
}
