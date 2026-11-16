// Settings of this copy of Kalkar Kompakt. The only file to change when
// you host the app yourself; see README.md, "Selbst hosten".
window.KOMPAKT_CONFIG = {
  // The backend for sources without CORS (warnings, pollen, council,
  // roads, pharmacies …), reports of users and live bus departures: the
  // Edge Function in supabase/functions/kalkar-kompakt. Leave it empty
  // ("") and the app runs from its own files plus Bright Sky and
  // PEGELONLINE; the parts that need the backend stay hidden.
  apiBase: 'https://erruhlqtrnuxgguvbein.supabase.co/functions/v1/kalkar-kompakt',

  // Map tiles and glyphs (tool/map/README.md). "" hides the map.
  mapBase: 'https://kalkar-it.de/karte',

  // Show the places for local businesses ("Partner vor Ort", docs/partner.md).
  // Off since 27.10.2026, a decision of the operator.
  partners: false,

  // Address for corrections, shown on the info page. "" hides it.
  contact: 'mailto:hi@kalkar-it.de?subject=Kalkar%20Kompakt',

  // Legal notice and privacy policy of whoever hosts this copy.
  imprint: 'https://kalkar-it.de/impressum/',
  privacy: 'https://kalkar-it.de/datenschutz/',
};
