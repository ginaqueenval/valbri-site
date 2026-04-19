import request from "../utils/request";

export function getContentList(params) {
  return request({ url: "/valbri/contents", method: "get", params });
}
