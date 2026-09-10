import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <div id="page-content" tabIndex={-1} className="min-h-screen outline-none">{children}</div>
      <Footer />
    </>
  );
}
