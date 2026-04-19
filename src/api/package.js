import request from "../utils/request";

export function getPackageList(params) {
  return request({ url: "/valbri/packages", method: "get", params });
}

export function getPackageDetail(id) {
  return request({ url: `/valbri/packages/${id}`, method: "get" });
}
