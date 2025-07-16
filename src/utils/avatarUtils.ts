// Utility function to get default avatar for users and chats
export const getDefaultAvatar = (type: "global" | "user"): string => {
  if (type === "global") {
    return "🌍"; // Globe emoji for global chat
  }

  // Return a consistent default avatar for all users
  return "👤"; // Single default user icon for everyone
};

// Alternative function to get first letter if needed
export const getAvatarInitial = (name?: string): string => {
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  return "?";
};

// Function to get avatar background color based on name
export const getAvatarColor = (name?: string): string => {
  if (!name) return "bg-gray-500";

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];

  // Use name length and char codes to generate consistent color
  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[colorIndex];
};
