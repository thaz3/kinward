import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kinward", template: "%s | Kinward" },
  description: "A private family care-coordination application.",
  applicationName: "Kinward",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#f7f6f2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      {/* Browser writing assistants can add attributes to body before React
          hydrates. Those extension-owned attributes are outside Kinward's
          render tree and should not trigger the development error overlay. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
