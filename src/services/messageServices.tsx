import axios from "axios";
import type { GlobalMessages } from "../types/index";

class MessageServices {
  async getGlobalMessages(): Promise<GlobalMessages[]> {
    try {
      const token = localStorage.getItem("jwt");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/messages/global-messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch messages");
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  async getPrivateMessages(receiverId: number): Promise<GlobalMessages[]> {
    try {
      const token = localStorage.getItem("jwt");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/messages/private-messages/${receiverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch private messages");
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }
}

export const messageServices = new MessageServices();
