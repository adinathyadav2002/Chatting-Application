import type { GlobalMessages } from "../types/index";

class MessageServices {
  async getGlobalMessages(): Promise<GlobalMessages[]> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messages/global-messages`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  async getPrivateMessages(receiverId: number): Promise<GlobalMessages[]> {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/messages/private-messages/${receiverId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }
}

export const messageServices = new MessageServices();
