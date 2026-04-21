import axiosInstance from './axiosInstance';

export interface ChatUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  sender: ChatUser;
  receiver: ChatUser;
  message: string;
  createdAt: string;
  readMessage: boolean;
}

export const chatService = {
  getContacts: async (): Promise<ChatUser[]> => {
    const response = await axiosInstance.get<ChatUser[]>('/chat/users');
    return response.data;
  },

  getConversation: async (userId: number, contactId: number): Promise<ChatMessage[]> => {
    const response = await axiosInstance.get<ChatMessage[]>(`/chat/${userId}/${contactId}`);
    return response.data;
  },

  sendMessage: async (senderId: number, receiverId: number, message: string): Promise<ChatMessage> => {
    const response = await axiosInstance.post<ChatMessage>('/chat/send', {
      senderId,
      receiverId,
      message,
    });
    return response.data;
  },

  markConversationRead: async (userId: number, contactId: number): Promise<void> => {
    await axiosInstance.put(`/chat/${userId}/${contactId}/read`);
  },
};
