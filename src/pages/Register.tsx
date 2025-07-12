import React, { useState } from "react";
import userServices from "../services/userServices";
import { useNavigate } from "react-router-dom";

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

      if (result.success) {
        showToastMessage(
          `Welcome to the chat, ${result.user.name}! 🎉`,
          "success"
        );
        // Reset form after successful registration
        setFormData({ name: "", email: "", password: "", avatar: "" });
        setConfirmPassword("");
        navigate("/login");
      } else {
        showToastMessage(result.message, "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToastMessage("Registration failed. Please try again.", "error");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform ${
            toastType === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {toastType === "success" ? "✅" : "❌"}
            </span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md my-2">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 mb-2"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="Enter your full name"
              />
            </div>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="Enter your email"
              />
            </div>{" "}
            {/* Avatar Selection */}
            <div>
              <label
                htmlFor="avatar"
                className="block text-sm font-semibold text-gray-700 mb-2"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="Enter an emoji or icon (e.g., 😊, 🚀, ⭐)"
              />
              {formData.avatar && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg">{formData.avatar}</span>
                  <span className="text-xs text-gray-600">Preview</span>
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
                className="block text-sm font-semibold text-gray-700 mb-2"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="Create a password (min 6 characters)"
              />
            </div>
            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="Confirm your password"
              />
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="#"
                className="text-purple-600 hover:text-purple-500 font-semibold transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
