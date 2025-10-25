import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import Beach from "../assets/Beach.jpg";
import NavBar from "./NavBar";

const Signin = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/prod/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!response.ok) {
        // Handle error response
        let errorMessage = "Invalid credentials";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use default message
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();

      // Check for access token in various possible field names
      const token = data.access_token || data.accessToken || data.token;
      
      if (token) {
        // Store access token in session storage
        sessionStorage.setItem("access_token", token);
        // Notify navbar about login status change
        window.dispatchEvent(new Event("authStatusChange"));
        // Redirect to home
        navigate("/");
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Signin error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    
    // Validate passwords match
    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    // Validate password length
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters");
      return;
    }

    setSignupLoading(true);

    try {
      const requestBody = {
        email: signupEmail,
        password: signupPassword,
      };

      console.log("Signup request:", requestBody);

      const response = await fetch(
        "/api/prod/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Signup response status:", response.status);

      if (!response.ok) {
        // Handle error response
        let errorMessage = "Signup failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error("Signup error:", errorData);
        } catch (e) {
          // If response is not JSON, use default message
          console.error("Signup response not JSON");
        }
        setSignupError(errorMessage);
        return;
      }

      const data = await response.json();

      // If successful, switch to signin tab and clear signup form
      if (data.message || response.ok) {
        setSignupError("");
        setSignupEmail("");
        setSignupPassword("");
        setConfirmPassword("");
        setActiveTab("signin");
        // Show success message temporarily
        setError("Signup successful! Please sign in.");
      }
    } catch (err) {
      setSignupError("Network error. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div
      className="w-screen h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `url(${Beach})`,
      }}
    >
      {/* Frosted Glass Auth Box */}
      <div className="relative z-10 w-[65%] max-w-md p-10 rounded-[2rem] bg-white/10 border border-white/30 backdrop-blur-lg shadow-2xl">
        {/* Tabs */}
        <div className="flex justify-center gap-10 mb-8 text-white uppercase text-sm tracking-wider">
          <button
            onClick={() => {
              setActiveTab("signin");
              setError("");
              setSignupError("");
            }}
            className={`pb-2 transition-all ${
              activeTab === "signin"
                ? "border-b-2 border-white font-medium"
                : "opacity-70 hover:opacity-100 border-b-2 border-transparent"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError("");
              setSignupError("");
            }}
            className={`pb-2 transition-all ${
              activeTab === "signup"
                ? "border-b-2 border-white font-medium"
                : "opacity-70 hover:opacity-100 border-b-2 border-transparent"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Animated Forms */}
        <div className="relative min-h-[230px]">
          <AnimatePresence mode="wait">
            {activeTab === "signin" ? (
              <Motion.form
                key="signin"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col gap-5"
                onSubmit={handleSignin}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                />
                {error && (
                  <p className="text-red-400 text-sm text-center mt-2">
                    {error}
                  </p>
                )}
                <Motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{
                    backgroundColor: "#000",
                    color: "#fff",
                    scale: 1.03,
                    borderColor: "#000",
                    borderWidth: 2,
                  }}
                  transition={{ duration: 0.25 }}
                  className="w-full mt-2 py-3 bg-white text-black rounded-full font-medium tracking-wide border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Motion.button>
              </Motion.form>
            ) : (
              <Motion.form
                key="signup"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col gap-5"
                onSubmit={handleSignup}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="w-full p-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  className="w-full p-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                />
                {signupError && (
                  <p className="text-red-400 text-sm text-center mt-2">
                    {signupError}
                  </p>
                )}
                <Motion.button
                  type="submit"
                  disabled={signupLoading}
                  whileHover={{
                    backgroundColor: "#000",
                    color: "#fff",
                    scale: 1.03,
                    borderColor: "#000",
                    borderWidth: 2,
                  }}
                  transition={{ duration: 0.25 }}
                  className="w-full mt-2 py-3 bg-white text-black rounded-full font-medium tracking-wide border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signupLoading ? "Signing Up..." : "Sign Up"}
                </Motion.button>
              </Motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Signin;
