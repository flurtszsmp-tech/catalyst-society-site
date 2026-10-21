/* ===========================================================
   Peta ikon seluruh situs.

   Disatukan otomatis dari tiga sprite lama (index.html, halaman
   komunitas, passport-icons.js). Setiap nilai adalah isi <svg> 24x24
   yang ditulis tim sendiri, bukan isian pengguna, jadi aman dirender
   lewat dangerouslySetInnerHTML.
   =========================================================== */
export const ICON_PATHS: Record<string, string> = {
  "arrow": "<path d=\"M4 12h16M14 6l6 6-6 6\"/>",
  "users": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20a6 6 0 0 1 12 0M17 6a3 3 0 0 1 0 6M15 20a6 6 0 0 0-1-3.3\"/>",
  "network": "<circle cx=\"12\" cy=\"5\" r=\"2.4\"/><circle cx=\"5\" cy=\"18\" r=\"2.4\"/><circle cx=\"19\" cy=\"18\" r=\"2.4\"/><path d=\"M10.6 6.9 6.4 15.8M13.4 6.9l4.2 8.9M7.4 18h9.2\"/>",
  "capital": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v10M14.5 9.2c-.6-.9-1.6-1.2-2.7-1.2-1.5 0-2.6.8-2.6 2s1 1.8 2.6 2.1c1.7.3 2.8.9 2.8 2.2s-1.2 2.1-2.8 2.1c-1.3 0-2.4-.5-3-1.5\"/>",
  "door": "<path d=\"M14 3H6v18h8M14 3l4 2v14l-4 2M14 3v18M11 12h.01\"/>",
  "chart": "<path d=\"M4 20h16M7 20V11M12 20V6M17 20v-6\"/>",
  "briefcase": "<rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18\"/>",
  "shield": "<path d=\"M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z\"/><path d=\"M9 12l2 2 4-4\"/>",
  "cube": "<path d=\"M12 3l8 4.5v9L12 21l-8-4.5v-9z\"/><path d=\"M12 3v18M4 7.5l8 4.5 8-4.5\"/>",
  "bulb": "<path d=\"M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.3-1 2.5H9c0-1.2-.3-1.8-1-2.5A6 6 0 0 1 12 3z\"/>",
  "spark": "<path d=\"M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z\"/>",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.3\"/>",
  "spark4": "<path d=\"M12 1.6c.9 5.6 2.9 8.3 8.6 9.2v2.4c-5.7.9-7.7 3.6-8.6 9.2-.9-5.6-2.9-8.3-8.6-9.2v-2.4c5.7-.9 7.7-3.6 8.6-9.2z\"/>",
  "ig": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.2\" cy=\"6.8\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/>",
  "passport": "<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/><path d=\"M9 16h6\"/>",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"6\"/><path d=\"M20 20l-4.5-4.5\"/>",
  "cap": "<path d=\"M12 4 2 9l10 5 10-5-10-5zM6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5M22 9v5\"/>",
  "flask": "<path d=\"M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7 15h10\"/>",
  "rocket": "<path d=\"M12 3c3.5 2 5 5.5 5 9l-3 3H10l-3-3c0-3.5 1.5-7 5-9zM10 18c-1 1-1.5 3-1.5 3s2-.5 3-1.5M14 18c1 1 1.5 3 1.5 3s-2-.5-3-1.5\"/><circle cx=\"12\" cy=\"10\" r=\"1.6\"/>",
  "moon": "<path d=\"M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z\"/>",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4.2\"/><path d=\"M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8\"/>",
  "back": "<path d=\"M20 12H4M10 6l-6 6 6 6\"/>",
  "out": "<path d=\"M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4\"/>",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18z\"/>",
  "wa": "<path d=\"M3.5 20.5l1.3-4a8 8 0 1 1 3.2 3.1z\"/><path d=\"M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.4-.7-1 .8a5 5 0 0 1-2.2-2.2l.8-1L10.9 9c-.5 0-1 .4-1 1z\" fill=\"currentColor\" stroke=\"none\"/>",
  "discord": "<path d=\"M8.5 6.5A13 13 0 0 1 12 6c1.2 0 2.4.2 3.5.5L17 5c2 1 3.5 3 4 6 .4 2.6 0 5-1 6.5-1.2.9-2.6 1.5-4 1.8l-.9-1.6M7.9 17.7 7 19.3a11 11 0 0 1-4-1.8c-1-1.5-1.4-3.9-1-6.5.5-3 2-5 4-6z\"/><ellipse cx=\"9.3\" cy=\"13\" rx=\"1.2\" ry=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><ellipse cx=\"14.7\" cy=\"13\" rx=\"1.2\" ry=\"1.5\" fill=\"currentColor\" stroke=\"none\"/>",
  "tg": "<path d=\"M21 4.5 2.9 11.2l5.4 1.7M21 4.5l-3 14.2-5.2-4.3-2.2 3.2-.3-5.1M21 4.5 10.3 12.5\"/>",
  "tiktok": "<path d=\"M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5c.35 0 .7.05 1 .14\"/><path d=\"M14 3c.4 2.6 2.1 4.2 4.8 4.4\"/>",
  "yt": "<rect x=\"2.5\" y=\"5.5\" width=\"19\" height=\"13\" rx=\"4\"/><path d=\"M10.5 9.5v5l4.2-2.5z\"/>",
  "in": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><path d=\"M7.5 10.5V17M7.5 7.5v.01M11.5 17v-3.6a2.4 2.4 0 0 1 4.8 0V17M11.5 10.5V17\"/>",
  "fb": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><path d=\"M15 8h-1.6a1.9 1.9 0 0 0-1.9 1.9V21M9.6 13.2h4.9\"/>",
  "x": "<path d=\"M4 4l16 16M20 4L4 20\"/>",
  "gh": "<path d=\"M9 20c-4 1.3-4-2.2-5.5-2.7M14.5 22v-3.4c0-.9-.2-1.5-.7-2 3-.3 5.7-1.5 5.7-6a4.7 4.7 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 3.9 5.3 4.2 5.3 4.2a4.3 4.3 0 0 0-.1 3.2A4.7 4.7 0 0 0 3.8 10.6c0 4.5 2.7 5.7 5.7 6-.4.5-.6 1-.7 1.8V22\"/>",
  "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2.5\"/><path d=\"M3.6 6.8 12 13l8.4-6.2\"/>",
  "home": "<path d=\"M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z\"/>",
  "user": "<circle cx=\"12\" cy=\"8\" r=\"3.4\"/><path d=\"M4.5 20a7.5 7.5 0 0 1 15 0\"/>",
  "journey": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"m15 9-2.2 5.2L8 16l2.2-5.2z\"/>",
  "award": "<circle cx=\"12\" cy=\"9\" r=\"5.2\"/><path d=\"m8.6 13.4-1.1 7 4.5-2.3 4.5 2.3-1.1-7\"/>",
  "skills": "<path d=\"M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z\"/>",
  "settings": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z\"/>",
  "bell": "<path d=\"M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5\"/><path d=\"M13.7 19a2 2 0 0 1-3.4 0\"/>",
  "chat": "<path d=\"M20.5 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 20.5 12z\"/>",
  "chevron": "<path d=\"M6 9.5 12 15l6-5.5\"/>",
  "menu": "<path d=\"M4 7h16M4 12h16M4 17h16\"/>",
  "plus": "<path d=\"M12 5v14M5 12h14\"/>",
  "pencil": "<path d=\"M4 20h4L19.5 8.5a2 2 0 0 0-2.8-2.8L4.2 18.2z\"/><path d=\"M15.5 5.7 18.3 8.5\"/>",
  "share": "<circle cx=\"18\" cy=\"5.5\" r=\"2.5\"/><circle cx=\"6\" cy=\"12\" r=\"2.5\"/><circle cx=\"18\" cy=\"18.5\" r=\"2.5\"/><path d=\"m8.2 10.8 7.6-4M8.2 13.2l7.6 4\"/>",
  "copy": "<rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2.2\"/><path d=\"M5.5 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v.5\"/>",
  "pin": "<path d=\"M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.6\"/>",
  "check": "<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>",
  "up": "<path d=\"M12 19V5M6 11l6-6 6 6\"/>",
  "qr": "<rect x=\"4\" y=\"4\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"14\" y=\"4\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"14\" width=\"6\" height=\"6\" rx=\"1\"/><path d=\"M14 14h2.5v2.5H14zM19.5 14H20v.5M14 19.5v.5h.5M17.5 17.5H20v2.5h-2.5z\"/>",
  "linkedin": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><path d=\"M7.5 10.5V17M7.5 7.5v.01M11.5 17v-3.6a2.4 2.4 0 0 1 4.8 0V17M11.5 10.5V17\"/>",
  "instagram": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.2\" cy=\"6.8\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/>",
  "youtube": "<rect x=\"2.5\" y=\"5.5\" width=\"19\" height=\"13\" rx=\"4\"/><path d=\"M10.5 9.5v5l4.2-2.5z\"/>",
  "doc": "<path d=\"M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z\"/><path d=\"M14 3v4h4M9 13h6M9 17h4\"/>",
  "j-explorer": "<circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6\"/>",
  "j-connector": "<circle cx=\"6\" cy=\"8\" r=\"2.2\"/><circle cx=\"18\" cy=\"8\" r=\"2.2\"/><circle cx=\"12\" cy=\"17\" r=\"2.2\"/><path d=\"M7.6 9.6 10.6 15M16.4 9.6 13.4 15M8.2 8h7.6\"/>",
  "j-builder": "<path d=\"M12 4l7 4v8l-7 4-7-4V8z\"/><path d=\"M12 4v16M5 8l7 4 7-4\"/>",
  "j-challenger": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/>",
  "j-contributor": "<path d=\"M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9z\"/>",
  "j-innovator": "<path d=\"M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.3-1 2.5H9c0-1.2-.3-1.8-1-2.5A6 6 0 0 1 12 3z\"/>",
  "b-spark": "<path d=\"M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z\"/>",
  "b-users": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20a6 6 0 0 1 12 0M17 6a3 3 0 0 1 0 6M15 20a6 6 0 0 0-1-3.3\"/>",
  "b-search": "<circle cx=\"11\" cy=\"11\" r=\"6\"/><path d=\"M20 20l-4.5-4.5\"/>",
  "b-globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18z\"/>",
  "b-rocket": "<path d=\"M12 3c3.5 2 5 5.5 5 9l-3 3H10l-3-3c0-3.5 1.5-7 5-9z\"/><path d=\"M10 18c-1 1-1.5 3-1.5 3s2-.5 3-1.5M14 18c1 1 1.5 3 1.5 3s-2-.5-3-1.5\"/><circle cx=\"12\" cy=\"10\" r=\"1.6\"/>",
  "b-badge": "<circle cx=\"12\" cy=\"9\" r=\"5.2\"/><path d=\"m8.6 13.4-1.1 7 4.5-2.3 4.5 2.3-1.1-7\"/>",
  "b-cube": "<path d=\"M12 3l8 4.5v9L12 21l-8-4.5v-9z\"/><path d=\"M12 3v18M4 7.5l8 4.5 8-4.5\"/>",
  "s-showcase": "<path d=\"M4 20h16M7 20v-6M12 20V8M17 20v-9\"/><path d=\"M19 3.5c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3z\"/>",
  "s-journey": "<path d=\"M6 4c6 0 6 6 0 6s-6 6 0 6 6 4 12 4\"/><circle cx=\"6\" cy=\"4\" r=\"1.6\"/><circle cx=\"18\" cy=\"20\" r=\"1.6\"/>",
  "s-network": "<circle cx=\"12\" cy=\"7\" r=\"2.6\"/><circle cx=\"5\" cy=\"17\" r=\"2.6\"/><circle cx=\"19\" cy=\"17\" r=\"2.6\"/><path d=\"M10 8.8 6.6 14.6M14 8.8l3.4 5.8M7.6 17h8.8\"/>",
  "s-impact": "<path d=\"M12 3c3.5 2 5 5.5 5 9l-3 3H10l-3-3c0-3.5 1.5-7 5-9z\"/><path d=\"M10 18c-1 1-1.5 3-1.5 3s2-.5 3-1.5M14 18c1 1 1.5 3 1.5 3s-2-.5-3-1.5\"/>",
  "bolt": "<path d=\"M13.2 2 4.5 13.4h5.4L10.3 22l8.7-11.4h-5.4z\"/>",
  "verified": "<circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"currentColor\"/><path d=\"m7.6 12.3 3 3 5.8-6.2\" fill=\"none\" stroke=\"#000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
  "hex": "<path d=\"M23 1.6 43.2 13v22.8L23 47.2 2.8 35.8V13z\"/>"
};

// Ikon tambahan untuk fitur Passport yang tidak ada di situs lama.
ICON_PATHS['logout'] = '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>';
ICON_PATHS['trash'] = '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>';
ICON_PATHS['upload'] = '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>';
ICON_PATHS['download'] = '<path d="M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>';
ICON_PATHS['lock'] = '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';
ICON_PATHS['eye'] = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>';
ICON_PATHS['eye-off'] = '<path d="M3 3l18 18M10.6 6a9.6 9.6 0 0 1 1.4-.1c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.3-1.1M9.9 9.9a2.8 2.8 0 0 0 4.2 4.2"/>';
ICON_PATHS['close'] = '<path d="M6 6l12 12M18 6L6 18"/>';
ICON_PATHS['edit'] = '<path d="M4 20h4L19.5 8.5a2 2 0 0 0-2.8-2.8L4.2 18.2z"/><path d="M15.5 5.7 18.3 8.5"/>';
ICON_PATHS['link'] = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>';
ICON_PATHS['key'] = '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>';
ICON_PATHS['palette'] = '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>';
ICON_PATHS['language'] = '<path d="M4 5h9M8.5 3v2M6 5c.6 3.5 3 6.3 6 7.5M11 5c-.6 3.5-3 6.3-6 7.5M13 21l4-9 4 9M14.3 18h5.4"/>';
ICON_PATHS['alert'] = '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.01"/>';
ICON_PATHS['info'] = '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>';
ICON_PATHS['calendar'] = '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>';
ICON_PATHS['user-plus'] = '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M19 8v6M16 11h6"/>';
ICON_PATHS['user-check'] = '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M15.5 11.5l2 2 4-4"/>';
ICON_PATHS['j-founder'] = '<path d="M4 17.5 3 8l5 4 4-7 4 7 5-4-1 9.5z"/><path d="M5 21h14"/>';
ICON_PATHS['b-crown'] = '<path d="M4 17.5 3 8l5 4 4-7 4 7 5-4-1 9.5z"/><path d="M5 21h14"/>';
ICON_PATHS['clock'] = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
ICON_PATHS['filter'] = '<path d="M4 5h16l-6.5 8v5.5L10.5 20v-7z"/>';
ICON_PATHS['external'] = '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>';
ICON_PATHS['trophy'] = '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>';
ICON_PATHS['shield-check'] = '<path d="M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6z"/><path d="m9 12 2 2 4-4"/>';

/** Ikon yang dicat penuh, bukan digores. */
export const FILLED_ICONS = new Set<string>(["spark4","bolt","verified"]);

export const FLAG_PATHS: Record<'id' | 'en' | 'zh', string> = {
  "id": "<rect width=\"24\" height=\"8\" y=\"4\" fill=\"#ce1126\"/><rect width=\"24\" height=\"8\" y=\"12\" fill=\"#fff\"/>",
  "en": "<rect width=\"24\" height=\"16\" y=\"4\" fill=\"#012169\"/> <path d=\"M0 4l24 16M24 4L0 20\" stroke=\"#fff\" stroke-width=\"3.2\"/> <path d=\"M0 4l24 16M24 4L0 20\" stroke=\"#c8102e\" stroke-width=\"1.9\"/> <path d=\"M12 4v16M0 12h24\" stroke=\"#fff\" stroke-width=\"5.4\"/> <path d=\"M12 4v16M0 12h24\" stroke=\"#c8102e\" stroke-width=\"3.2\"/>",
  "zh": "<rect width=\"24\" height=\"16\" y=\"4\" fill=\"#ee1c25\"/> <path fill=\"#ff0\" d=\"M5 7.2l.7 2.1h2.2l-1.8 1.3.7 2.1L5 11.4l-1.8 1.3.7-2.1L2.1 9.3h2.2z\"/> <circle fill=\"#ff0\" cx=\"10.4\" cy=\"7\" r=\".8\"/><circle fill=\"#ff0\" cx=\"12.2\" cy=\"8.8\" r=\".8\"/> <circle fill=\"#ff0\" cx=\"12.2\" cy=\"11.2\" r=\".8\"/><circle fill=\"#ff0\" cx=\"10.4\" cy=\"12.9\" r=\".8\"/>"
};
