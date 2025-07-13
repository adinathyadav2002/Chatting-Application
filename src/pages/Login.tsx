import React, { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
// import { useSocket } from "../hooks/useSocket";
import userServices from "../services/userServices";
import { useSocket } from "../hooks/useSocket";

interface userDataType {
  id: number;
  email: string;
  name: string;
  createdAt?: Date;
  avatar?: string;
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
  const { isLoggedIn, userdata, setIsLoggedIn, handleUpdateUser } =
    useUserContext();
  const { socket, isConnected } = useSocket();

  // const { socket } = useSocket();

  useEffect(() => {
    if (isLoggedIn && userdata && userdata.id) {
      navigate("/home");
    }
  }, [isLoggedIn, navigate]);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!socket || !isConnected) {
      showToastMessage("Socket connection is not established.", "error");
      setIsLoading(false);
      return;
    }

    const response: loginResponseType = await userServices.loginUser(
      email.trim(),
      "Test@123"
    );

    const user = response?.user;

    // Emit user connected event with socket ID
    // socket.on("user connected", async (userId) => {
    //   try {
    //     // Update user's socketId and isOnline status
    //     await prisma.user.update({
    //       where: { id: userId },
    //       data: {
    //         socketId: socket.id, // Update socketId
    //         isOnline: true, // Set user as online
    //       },
    //     });

    //   } catch (err) {
    //     console.error("Error updating user status:", err);
    //   }
    // });

    if (user) {
      socket.emit("user connected", { userId: parseInt(user?.id) });
      // Login successful
      showToastMessage(`Welcome back, ${user?.name}! 🎉`, "success");
      setIsLoggedIn(true);
      // Update user context
      handleUpdateUser(user);
      navigate("/home");
    } else {
      // Login failed
      showToastMessage("Invalid email or password. Please try again.", "error");
    }
    setIsLoading(false);
  };

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

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">💬</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to join the conversation</p>
          </div>
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="Enter your email"
              />
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
                type="password"
                value="Test@123"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              // disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
              >
                Create one
              </a>
            </p>
          </div>{" "}
        </div>
      </div>
    </div>
  );
};

export default Login;
