export const FADE_IN_ANIMATION_SETTINGS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const STAGGER_CHILD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, type: "spring" } },
};

export const PAPERMARK_HEADERS = {
  headers: {
    "x-powered-by":
      "Papermark.io - Document sharing infrastructure for the modern web",
  },
};

export const REACTIONS = [
  {
    emoji: "❤️",
    label: "heart",
  },
  {
    emoji: "💸",
    label: "money",
  },
  {
    emoji: "👍",
    label: "up",
  },
  {
    emoji: "👎",
    label: "down",
  },
];

// growing list of blocked pathnames that lead to 404s
export const BLOCKED_PATHNAMES = [
  "/phpmyadmin",
  "/server-status",
  "/wordpress",
  "/_all_dbs",
];
