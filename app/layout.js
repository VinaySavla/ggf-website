import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: "Godhra Graduates Forum - Community Events & Trust",
  description: "GGF is a community trust organizing educational, sports, and fellowship events in Godhra. Join us for tournaments, quizzes, and social activities.",
  keywords: "Godhra, Graduates Forum, Community Events, Sports, Education, Trust",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
