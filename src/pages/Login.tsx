import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import userServices from "../services/userServices";
import { useSocket } from "../hooks/useSocket";
import { Typewriter } from "@/components/ui/typewriter-text";
import { Eye, EyeOff } from "lucide-react";

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

      const user = response?.user;
      const token = response?.user?.token;
      if (user && token) {
        localStorage.setItem("jwt", token);
        socket.emit("user connected", { userId: user?.id });
        showToastMessage(`Welcome back, ${user?.name}!`, "success");
        navigate("/home/0");
      }
    } catch (err) {
      console.error("Login error:", err);
      showToastMessage("Invalid email or password. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="mx-auto grid w-full max-w-[360px] gap-6">
          {/* Header with Logo */}
          <div className="flex flex-col items-center gap-2 text-center">
            <img
              src="/logo_bg.png"
              alt="logo"
              className="w-12 h-12 mb-1 object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Sign in to your account
            </h1>
            <p className="text-sm text-zinc-400">
              Enter your credentials below to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid gap-4">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                required
                autoComplete="email"
                className="flex h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 pe-10 text-sm text-white placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
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

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-4 text-sm font-medium text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-zinc-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Hero Image with Typewriter Quote */}
      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{
          backgroundImage: `url("https://cdn.21st.dev/assets/mirror/39/39e7b0edd6a7156713d08ec970769bf29360427d3dc8523ee32079885ccca5dd.png")`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end p-6 pb-12">
          <blockquote className="space-y-2 text-center text-white max-w-md">
            <p className="text-lg font-medium drop-shadow-md">
              “<Typewriter
                text="Welcome Back! The journey continues."
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

export default Login;