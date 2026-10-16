import React, { useState } from "react";
import userServices from "../services/userServices";
import { Link, useNavigate } from "react-router-dom";
import { Typewriter } from "@/components/ui/typewriter-text";
import { Eye, EyeOff } from "lucide-react";

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
      console.error("Registration error:", error.response?.data?.error);
      showToastMessage(
        error.response?.data?.error || "Registration failed. Please try again.",
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
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-zinc-950 text-zinc-100">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform ${
            toastType === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-bold">{toastType === "success" ? "✓" : "✕"}</span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Left Column: Form */}
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[360px] gap-5 my-auto">
          {/* Header with Logo */}
          <div className="flex flex-col items-center gap-2 text-center">
            <img
              src="/logo_bg.png"
              alt="logo"
              className="w-12 h-12 mb-1 object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create an account
            </h1>
            <p className="text-sm text-zinc-400">
              Enter your details below to sign up
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid gap-3.5">
            {/* Name Field */}
            <div className="grid gap-1.5">
              <label
                htmlFor="name"
                className="text-xs sm:text-sm font-medium text-zinc-300"
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
                placeholder="John Doe"
                autoComplete="name"
                className="flex h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Email Field */}
            <div className="grid gap-1.5">
              <label
                htmlFor="email"
                className="text-xs sm:text-sm font-medium text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="m@example.com"
                autoComplete="email"
                className="flex h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Avatar Selection */}
            <div className="grid gap-1.5">
              <label
                htmlFor="avatar"
                className="text-xs sm:text-sm font-medium text-zinc-300"
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
                    const singleEmoji = chars.length > 0 ? chars[chars.length - 1] : "";
                    setFormData((prev) => ({
                      ...prev,
                      avatar: singleEmoji,
                    }));
                  }}
                  className="w-12 h-9 sm:h-10 text-center text-xl rounded-xl border border-white/10 bg-zinc-900 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="✨"
                />
                <div className="flex-1 flex flex-wrap gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl">
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
            </div>

            {/* Password Field */}
            <div className="grid gap-1.5">
              <label
                htmlFor="password"
                className="text-xs sm:text-sm font-medium text-zinc-300"
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="flex h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 pe-10 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="grid gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs sm:text-sm font-medium text-zinc-300"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="flex h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 pe-10 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-4 text-sm font-medium text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Hero Image with Typewriter Quote */}
      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{
          backgroundImage: `url("https://cdn.21st.dev/assets/mirror/c7/c7cb3a073970aa03472c652391db88fbbe39f1e33c8deb336a9c8e53b039ee01.png")`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end p-6 pb-12">
          <blockquote className="space-y-2 text-center text-white max-w-md">
            <p className="text-lg font-medium drop-shadow-md">
              “<Typewriter
                text="Create an account. A new chapter awaits."
                speed={60}
              />”
            </p>
            <cite className="block text-sm font-light text-zinc-300 not-italic drop-shadow">
              — Strangers Live
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default Register;