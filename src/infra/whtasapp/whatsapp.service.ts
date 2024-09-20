import axios from "axios";
import { User } from "../database/models/user.model";

const api = axios.create({ baseURL: process.env.RESUME_API_URL });

export const postSendResume = async (user: User) => {
  await api.post("/generate-resume", user);
};
