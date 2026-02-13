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
  const [showPassword, setShowPassword] = useState(false);
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

      const response: loginResponseType | undefined = await userServices.loginUser(
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
        navigate("/home/0");
      }

    } catch (err) {
      ;
      console.log(`got error ${err}`);
      showToastMessage("Invalid email or password. Please try again.", "error");
    } finally {
      setIsLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
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
          <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-gray-800 via-gray-900 to-black relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent"></div>

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
                <h2 className="text-5xl font-bold mb-6 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-md">
                  Sign in to access your account and continue your journey with us
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto bg-linear-to-br from-gray-900/50 to-black/50">
            <div className="max-w-md mx-auto h-full flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/10 backdrop-blur-sm border border-white/20">
                  <span className="text-2xl">
                    <img
                      src="./logo_bg.png"
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
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className=" cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
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
                  className="cursor-pointer w-full bg-linear-to-r from-white to-gray-300 text-black py-3 px-4 rounded-2xl font-semibold hover:from-gray-100 hover:to-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200"
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