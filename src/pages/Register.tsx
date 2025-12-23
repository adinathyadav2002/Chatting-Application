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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform ${toastType === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {toastType === "success" ? "✓" : "✕"}
            </span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 max-h-[95vh]">
        <div className="flex h-full max-h-[95vh]">
          {/* Left Side - Decorative */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-800 via-gray-900 to-black relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

            {/* Geometric Shapes */}
            <div className="absolute top-20 left-16 w-32 h-32 border-4 border-white/20 rounded-full"></div>
            <div className="absolute top-40 right-24 w-24 h-24 border-4 border-white/15 rotate-45"></div>
            <div className="absolute bottom-32 left-24 w-40 h-40 border-4 border-white/10"></div>
            <div className="absolute bottom-20 right-16 w-28 h-28 border-4 border-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-20 h-20 border-4 border-white/15 rotate-12"></div>

            {/* Triangle shapes */}
            <div className="absolute top-1/4 right-1/3 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-white/10"></div>
            <div className="absolute bottom-1/3 left-1/4 w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[60px] border-b-white/15 rotate-180"></div>

            {/* Small accent shapes */}
            <div className="absolute top-32 right-40 w-12 h-12 bg-white/5 rounded-full"></div>
            <div className="absolute bottom-40 left-40 w-16 h-16 bg-white/5 rotate-45"></div>

            <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
              <div className="text-center">
                <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Join Our Community
                </h2>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-md">
                  Connect with people around the world through real-time messaging
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto bg-gradient-to-br from-gray-900/50 to-black/50">
            <div className="max-w-md mx-auto h-full flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Create Account
                </h1>
                <p className="text-gray-400">Join the conversation today</p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-300 mb-1"
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
                    className="w-full px-4 py-2 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-300 mb-1"
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
                    className="w-full px-4 py-2 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label
                    htmlFor="avatar"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Avatar (Optional)
                  </label>
                  <input
                    id="avatar"
                    name="avatar"
                    type="text"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="w-full px-4 py-2 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Enter an emoji or icon (e.g., 😊, 🚀, ⭐)"
                  />
                  {formData.avatar && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg">{formData.avatar}</span>
                      <span className="text-xs text-gray-400">Preview</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    You can use any emoji, symbol, or short text as your avatar
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Create a password (min 6 characters)"
                  />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-gray-300 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Confirm your password"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full bg-gradient-to-r from-white to-gray-300 text-black py-2.5 px-4 rounded-2xl font-semibold hover:from-gray-100 hover:to-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-white hover:text-gray-300 font-semibold transition-colors"
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