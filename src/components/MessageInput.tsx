import React, { useState } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/10 p-6 bg-black/40 backdrop-blur-sm shadow-lg"
    >
      <div className="flex gap-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 px-4 py-3 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed transition-all duration-200 shadow-sm bg-white/5 hover:bg-white/10 text-white placeholder-gray-500 backdrop-blur-sm"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-8 py-3 bg-gradient-to-r from-white to-gray-300 text-black rounded-full hover:from-gray-100 hover:to-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed disabled:text-gray-500 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;