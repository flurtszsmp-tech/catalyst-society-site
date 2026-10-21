import IconDefs from "./components/IconDefs";

export const metadata = {
  title: "Catalyst: Passport, Finder, Academy",
  description: "Platform Catalyst Society: Passport, Finder, dan Academy.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IconDefs />
        {children}
      </body>
    </html>
  );
}
