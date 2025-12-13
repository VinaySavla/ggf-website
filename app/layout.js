import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: "GGF Community Portal - Godhra Graduates Forum",
  description: "GGF is a community trust organizing educational, sports, and fellowship events in Godhra. Join us for tournaments, quizzes, and social activities.",
  keywords: "Godhra, Graduates Forum, Community Events, Sports, Education, Trust",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
