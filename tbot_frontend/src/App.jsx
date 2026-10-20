import "./css/app.css";
import "./css/navbar.css";

import { Analytics } from "@vercel/analytics/react";
import ScrollToTop from "./components/scrollToTop.jsx";
import AppRoutes from "./routes.jsx";

function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <Analytics />
    </>
  );
}

export default App;
