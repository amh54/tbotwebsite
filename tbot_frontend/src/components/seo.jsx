import { useEffect } from "react";

const SITE_URL = "https://pvzhtbot.com";
const DEFAULT_IMAGE =
  "https://i.ibb.co/3YrvrJg1/darth-vader-swabbie.webp";

function Seo({
  title = "Tbot - Plants vs. Zombies Heroes Database, Decks & More",
  description = "Tbot is a Plants vs. Zombies Heroes community database featuring decks, decklists, cards, heroes, deck builders, guides, and more.",
  canonical = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
}) {
  useEffect(() => {
    const canonicalUrl = canonical.startsWith("http")
      ? canonical
      : `${SITE_URL}${canonical}`;

    document.title = title;

    const setMeta = (selector, attributes) => {
      let element = document.head.querySelector(selector);

      if (!element) {
        element = document.createElement("meta");

        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });

        document.head.appendChild(element);
      } else {
        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
    };

    const setLink = (selector, attributes) => {
      let element = document.head.querySelector(selector);

      if (!element) {
        element = document.createElement("link");

        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });

        document.head.appendChild(element);
      } else {
        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
    };

    setMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });

    setMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow",
    });

    setMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });

    setMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });

    setMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });

    setMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });

    setMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "Tbot",
    });

    setMeta('meta[property="og:image"]', {
      property: "og:image",
      content: image,
    });

    setMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });

    setMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });

    setMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });

    setMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: image,
    });

    setLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });
  }, [title, description, canonical, image, type, noindex]);

  return null;
}

export default Seo;