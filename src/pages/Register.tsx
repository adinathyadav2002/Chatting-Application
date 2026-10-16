import React, { useState } from "react";
import userServices from "../services/userServices";
import { Link, useNavigate } from "react-router-dom";

interface UserRegistration {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<UserRegistration>({
    name: "",
    email: "",
    password: "",
    avatar: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const navigate = useNavigate();

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToastMessage("Please enter your name.", "error");
      return false;
    }
    if (!formData.email.trim()) {
      showToastMessage("Please enter your email.", "error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToastMessage("Please enter a valid email address.", "error");
      return false;
    }
    if (formData.password.length < 6) {
      showToastMessage("Password must be at least 6 characters long.", "error");
      return false;
    }
    if (formData.password !== confirmPassword) {
      showToastMessage("Passwords do not match.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await userServices.registerUser(
        formData.name,
        formData.email,
        formData.password,
        formData.avatar
      );

      if (result?.success) {
        console.log(result);
        showToastMessage(
          `Welcome to the chat, ${result.user.email}!`,
          "success"
        );
        setFormData({ name: "", email: "", password: "", avatar: "" });
        setConfirmPassword("");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        showToastMessage(result.message, "error");
      }
    } catch (error: any) {
      console.error("Registration error:", error.response.data.error);
      showToastMessage(
        error.response.data.error || "Registration failed. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.password.trim() &&
    confirmPassword.trim();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 overflow-y-auto">
      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform ${toastType === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
            }`}
        >
          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-bold">
              {toastType === "success" ? "✓" : "✕"}
            </span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-white/10 max-h-[95vh]">
        <div className="flex h-full max-h-[95vh]">
          {/* Left Side - Decorative */}
          <div className="hidden lg:flex lg:w-1/2 bg-zinc-900/60 border-r border-white/5 relative overflow-hidden flex-col items-center justify-center p-10 text-center">
            <div className="relative z-10 flex flex-col items-center justify-center text-white">
              <h2 className="text-2xl lg:text-3xl font-semibold mb-3 text-white">
                Join Our Community
              </h2>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed max-w-sm">
                Connect with people around the world through real-time messaging
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 p-6 sm:p-8 overflow-y-auto bg-zinc-900">
            <div className="max-w-sm mx-auto h-full flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-6">
                <img
                  src="/logo_bg.png"
                  alt="logo"
                  className="w-12 h-12 mx-auto mb-3 object-contain"
                />
                <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1.5">
                  Create Account
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400">Join the conversation today</p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs sm:text-sm font-medium text-zinc-300 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-zinc-950 text-white placeholder-zinc-500"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium text-zinc-300 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-zinc-950 text-white placeholder-zinc-500"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label
                    htmlFor="avatar"
                    className="block text-xs sm:text-sm font-medium text-zinc-300 mb-1"
                  >
                    Avatar (Single Emoji)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="avatar"
                      name="avatar"
                      type="text"
                      value={formData.avatar}
                      onChange={(e) => {
                        const val = e.target.value;
                        const chars = Array.from(val);
                        // Take only the very first emoji/grapheme cluster
                        const singleEmoji = chars.length > 0 ? chars[chars.length - 1] : "";
                        setFormData((prev) => ({
                          ...prev,
                          avatar: singleEmoji,
                        }));
                      }}
                      className="w-14 text-center text-xl px-2 py-1.5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-zinc-950 text-white"
                      placeholder="✨"
                    />
                    <div className="flex-1 flex flex-wrap gap-1 p-1 bg-zinc-950 border border-white/10 rounded-xl">
                      {["😎", "🚀", "🔥", "🐱", "⚡", "🌟", "👑", "🎮"].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar: em }))}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-zinc-800 transition-all ${
                            formData.avatar === em ? "bg-zinc-800 scale-105" : ""
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Select or type exactly one emoji for your profile
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs sm:text-sm font-medium text-zinc-300 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2 pr-11 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-zinc-950 text-white placeholder-zinc-500"
                      placeholder="Create a password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs sm:text-sm font-medium text-zinc-300 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 pr-11 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-zinc-950 text-white placeholder-zinc-500"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="cursor-pointer w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs sm:text-sm text-zinc-400">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;