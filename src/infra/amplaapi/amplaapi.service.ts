import axios from "axios";

const api = axios.create({ baseURL: process.env.AMPLA_API_URL });

api.interceptors.request.use((config) => {
  console.log("request to ampla-api --->", {
    url: config.url,
    method: config.method,
    data: config.data,
    params: config.params,
  });
  return config;
});

export const getImoveis = async (givenParams?: { id?: string }) => {
  const params = {
    page: 1,
    pageSize: 500,
    ...givenParams,
  };

  return await api.get("/imoveis", {
    params,
  });
};
