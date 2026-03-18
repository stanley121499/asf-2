import type { Metadata } from "next";
import "./globals.css";
import { AlertProvider } from "../context/AlertContext";
import { AuthProvider } from "../context/AuthContext";
import { AlertComponent } from "../components/AlertComponent";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "My App",
  description: "Customer shopping experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        {/* Global page-transition progress bar — visible at the very top of the viewport */}
        <NextTopLoader color="#6366f1" showSpinner={false} height={3} />
        <AlertProvider>
          <AuthProvider>
            <AlertComponent />
            {children}
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
