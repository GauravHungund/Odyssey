import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import OdysseyLanding from "./components/OdysseyLanding";
import SignIn from "./components/Signin";
import TripMap from "./components/TripMap";

export default function App() {
  return (
    <Router>
      {/* 🌍 Navbar sits outside all route content */}
      <NavBar />

      {/* Page container (below navbar) */}
      <div className="relative min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<OdysseyLanding />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/trip" element={<TripMap/>} />
        </Routes>
      </div>
    </Router>
  );
}
