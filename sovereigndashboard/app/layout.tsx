import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qori Node – Consola Dual",
  description:
    "Demo del Nodo Qori con consola dual Operación/Comunidad, telemetría simulada y operación aislada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
