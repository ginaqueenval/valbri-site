import request from "../utils/request";

export function playerLogin(data) {
  return request({ url: "/player/login", method: "post", data });
}

export function playerRegister(data) {
  return request({ url: "/player/register", method: "post", data });
}

export function getPlayerProfile() {
  return request({ url: "/player/profile", method: "get" });
}
