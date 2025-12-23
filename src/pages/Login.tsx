import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import userServices from "../services/userServices";
import { useSocket } from "../hooks/useSocket";

interface userDataType {
  id: number;
  email: string;
  name: string;
  createdAt?: Date;
  avatar?: string;
  token?: string;
}

interface loginResponseType {
  success: boolean;
  message?: string;
  user?: userDataType;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("set loading to true");

    setIsLoading(true);

    try {
      if (!socket || !isConnected) {
        showToastMessage("Socket connection is not established.", "error");
        setIsLoading(false);
        return;
      }

      const response: loginResponseType = await userServices.loginUser(
        email.trim(),
        password.trim()
      );

      console.log(response);

      const user = response?.user;
      const token = response?.user?.token;
      if (user && token) {
        localStorage.setItem("jwt", token);
        socket.emit("user connected", { userId: user?.id });
        showToastMessage(`Welcome back, ${user?.name}!`, "success");
        navigate("/");
      }

    } catch (err) {
      console.log(`got error ${err}`);
    } finally {
      console.log("set loading to false");
      setIsLoading(false);

      showToastMessage("Invalid email or password. Please try again.", "error");
    }
  };

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

            {/* Small accent shapes */}
            <div className="absolute top-32 right-40 w-12 h-12 bg-white/5 rounded-full"></div>
            <div className="absolute bottom-40 left-40 w-16 h-16 bg-white/5 rotate-45"></div>

            <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
              <div className="text-center">
                <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-md">
                  Sign in to access your account and continue your journey with us
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto bg-gradient-to-br from-gray-900/50 to-black/50">
            <div className="max-w-md mx-auto h-full flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/10 backdrop-blur-sm border border-white/20">
                  <span className="text-2xl">
                    <img
                      src="./favicon/apple-touch-icon.png"
                      alt="logo"
                      className="w-12 h-12"
                    />
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Sign In
                </h1>
                <p className="text-gray-400">Enter your credentials to continue</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-white to-gray-300 text-black py-3 px-4 rounded-2xl font-semibold hover:from-gray-100 hover:to-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-white hover:text-gray-300 font-semibold transition-colors"
                  >
                    Create one
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

export default Login;