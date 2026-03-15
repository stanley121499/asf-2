import type { Metadata } from "next";
import "./globals.css";
import { AlertProvider } from "../context/AlertContext";
import { AuthProvider } from "../context/AuthContext";
import { AlertComponent } from "../components/AlertComponent";

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
