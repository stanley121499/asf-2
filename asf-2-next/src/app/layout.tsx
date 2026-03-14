import type { Metadata } from "next";
import "./globals.css";
import { AlertProvider } from "../context/AlertContext";
import { AuthProvider } from "../context/AuthContext";
import { AlertComponent } from "../components/AlertComponent";
import { NavigationProgress } from "../components/NavigationProgress";

export const metadata: Metadata = {
  title: "System App Formula",
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
        <NavigationProgress />
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
