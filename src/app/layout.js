import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata = buildPageMetadata();

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className} suppressHydrationWarning>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <Providers>
          <main className="main-container">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
