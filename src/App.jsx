import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Fc26 from "./pages/Fc26.jsx";
import Checkout from "./pages/Checkout.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-[#070A0F] text-[#E7EDF7]">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070A0F]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* ✅ لوگو مستقیم بره Home */}
          <Link to="/home" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-[#00FF9A]/25 bg-[#0B1220] grid place-items-center">
              <span className="text-sm font-semibold text-[#00FF9A]">V</span>
            </div>
            <div>
              <div className="text-sm font-semibold">valbri</div>
              <div className="text-xs text-[#9AA7BD]">Gaming Marketplace</div>
            </div>
          </Link>

          <nav className="hidden gap-6 text-sm text-[#9AA7BD] md:flex">
            <Link to="/fc26-coins" className="hover:text-[#E7EDF7]">
              FC26 Coins
            </Link>
            <Link to="/about" className="hover:text-[#E7EDF7]">
              About
            </Link>
            <Link to="/contact" className="hover:text-[#E7EDF7]">
              Contact
            </Link>
          </nav>

          <div className="flex gap-2">
            <Link
              to="/fc26-coins"
              className="rounded-xl bg-[#00FF9A] px-4 py-2 text-sm font-semibold text-[#070A0F]"
            >
              Buy FC26 Coins
            </Link>
            <Link
              to="/checkout"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
            >
              Checkout
            </Link>
          </div>
        </div>
      </header>

      <Routes>
        {/* ✅ وقتی لینک اصلی باز شد، مستقیم بره Home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* صفحات */}
        <Route path="/home" element={<Home />} />
        <Route path="/fc26-coins" element={<Fc26 />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* ✅ هر مسیر اشتباه -> Home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-[#9AA7BD]">
          <div>© {new Date().getFullYear()} valbri</div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-[#E7EDF7]">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-[#E7EDF7]">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
