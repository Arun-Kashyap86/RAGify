import api from "./api";

export async function login(email, password) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function signup(name, email, password) {
  const response = await api.post("/auth/signup", {
    name,
    email,
    password,
  });
  return response.data;
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data;
}
