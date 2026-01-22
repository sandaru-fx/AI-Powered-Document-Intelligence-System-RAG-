import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Document Intelligence",
  description: "Advanced RAG System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`} >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
