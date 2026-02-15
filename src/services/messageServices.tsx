import axios from "axios";
import type { Message } from "../types/index";

class MessageServices {
  async getGlobalMessages(page: number = 1): Promise<{ messages: Message[], pagination: any }> {
    try {
      const token = localStorage.getItem("jwt");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/messages/global-messages?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch messages");
      }
      console.log(response);
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  async getPrivateMessages(senderId: number, receiverId: number, page: number = 1): Promise<{ messages: Message[], pagination: any }> {
    try {
      const token = localStorage.getItem("jwt");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL
        }/messages/private-messages/${receiverId}/${senderId}?page=${page}`,
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
