import api from "./api";

export const enviarMensajeContacto = async (payload) => {
  const { data } = await api.post("/contacto", payload);
  return data;
};

export const listarMensajesContacto = async () => {
  const { data } = await api.get("/contacto");
  return data?.data || [];
};
