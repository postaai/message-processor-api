import axios from "axios";

const api = axios.create({ baseURL: process.env.WHATSAPP_API_URL });

export const postSendResume = async (message: string) => {
  await api.post("/send-resume", { message });
};
