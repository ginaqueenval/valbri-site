import request from "../utils/request";

export function getSbcPackageList(params) {
  return request({ url: "/valbri/sbc-packages", method: "get", params });
}
