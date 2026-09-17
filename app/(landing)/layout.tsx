import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nexora-root">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
