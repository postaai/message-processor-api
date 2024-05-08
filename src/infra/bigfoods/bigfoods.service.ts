import axios from "axios";

const api = axios.create({
    baseURL: "https://bigfoods.vercel.app/api",
})


export const fetchJobs = async () => {
    const response = await api.get("/jobs");
    return response.data;
}

export const postSendCurriculo = async (data: any) => {
    const response = await api.post("/applications", data);
    return response.data;
}