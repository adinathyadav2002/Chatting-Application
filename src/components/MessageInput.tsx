import React, { useState } from "react";
import { Send } from "lucide-react";

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
      className="border-t border-white/10 px-3 py-2.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-zinc-900/90 backdrop-blur-md"
    >
      <div className="flex gap-2 sm:gap-2.5 items-center max-w-5xl mx-auto">
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={disabled}
            className="w-full pl-4 pr-4 py-2.5 md:py-3 text-base md:text-[15px] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-zinc-800 disabled:cursor-not-allowed transition-colors bg-zinc-950 text-white placeholder-zinc-400"
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-4 py-2.5 sm:px-5 sm:py-2.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-500 transition-colors font-medium cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
        >
          <span className="hidden sm:inline">Send</span>
          <Send size={15} />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;