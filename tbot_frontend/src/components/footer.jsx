import "../css/footer.css";

function Footer({ credits }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p>
          © {year} Tbot. All rights reserved. Web page designed and coded by{" "}
          <span className="footer-highlight">Tbone</span>. <br/>
          Halloween Swabbie used on navbar was designed by <span className="footer-highlight">LumpyMilkTea</span> on Discord
        </p>

        {credits && <p className="footer-credits">{credits}</p>}

        <p className="footer-disclaimer">
          Plants vs. Zombies Heroes is a trademark of Electronic Arts Inc. Tbot
          is an unofficial fan project and is not affiliated with or endorsed by
          EA or PopCap Games.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
