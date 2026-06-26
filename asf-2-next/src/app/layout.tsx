import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-display",
  display: "swap"
});
import { AlertProvider } from "../context/AlertContext";
import { AuthProvider } from "../context/AuthContext";
import { FeatureFlagsProvider } from "../context/FeatureFlagsContext";
import { AlertComponent } from "../components/AlertComponent";
import NextTopLoader from "nextjs-toploader";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "My App",
  description: "Customer shopping experience",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className={cormorant.variable}>
      <body className={`${inter.className} bg-[var(--color-bg)] text-[var(--color-text)]`}>
        {/* Global page-transition progress bar — visible at the very top of the viewport */}
        <NextTopLoader color="#6366f1" showSpinner={false} height={3} />
        <AlertProvider>
          <AuthProvider>
            <FeatureFlagsProvider>
              <AlertComponent />
              {children}
            </FeatureFlagsProvider>
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
