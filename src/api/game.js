import request from "../utils/request";

export function getGameList() {
  return request({ url: "/valbri/games", method: "get" });
}
