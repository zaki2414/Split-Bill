import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import WhySplitBill from "../components/WhySplitBill";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar onStart={onStart} />
      <Hero onStart={onStart} />
      <HowItWorks />
      <WhySplitBill />
      <CtaBanner onStart={onStart} />
      <Footer />
    </div>
  );
}
