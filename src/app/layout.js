import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MAZAL TIME | Sorteos Premium",
  description: "Participa en nuestras rifas de relojes de lujo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <main className="main-container">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
