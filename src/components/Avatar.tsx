import React from "react";
import { getAvatarColor } from "../utils/avatarUtils";

interface AvatarProps {
  type: "global" | "user";
  name?: string;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
  className?: string;
  emoji?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  type,
  name,
  size = "md",
  isOnline,
  className = "",
  emoji = ""
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const onlineIndicatorSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-4 h-4",
  };


  const bgColor = type === "global" ? "bg-blue-500" : getAvatarColor(name);

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      >
        {emoji}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute -bottom-1 -right-1 ${onlineIndicatorSizes[size]
            } rounded-full border-2 border-white ${isOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"
            }`}
        />
      )}
    </div>
  );
};

export default Avatar;
