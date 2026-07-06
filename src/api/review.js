import request from "../utils/request";
import { safeGetItem, safeSetItem } from "../utils/safeStorage.js";

// 提交评价(需登录)
export function submitReview(data) {
  return request({ url: "/valbri/reviews", method: "post", data });
}

// 编辑评价(7 天内,需登录)
export function editReview(data) {
  return request({ url: "/valbri/reviews", method: "put", data });
}

// 我的评价列表(需登录,分页)
export function getMyReviews(params) {
  return request({ url: "/valbri/reviews/my", method: "get", params });
}

// 根据订单查询评价(用于"已评价"状态判断)
export function getReviewByOrder(orderId) {
  return request({ url: `/valbri/reviews/order/${orderId}`, method: "get" });
}

// 公开评价列表(分页 · 支持 packageId / platform / rating / sort)
// 自动携带 voter_token,让后端按当前请求者标识返回每条评价的 voted 状态
export function getPublicReviews(params) {
  return request({
    url: "/valbri/reviews/list",
    method: "get",
    params,
    headers: { "X-Voter-Token": getVisitorToken() },
  });
}

// 套餐评分聚合统计
export function getPackageReviewStats(packageId) {
  return request({
    url: `/valbri/reviews/package/${packageId}/stats`,
    method: "get",
  });
}

// 首页精选评价(默认 9 条)
export function getHighlightReviews(limit = 9) {
  return request({
    url: "/valbri/reviews/highlights",
    method: "get",
    params: { limit },
    headers: { "X-Voter-Token": getVisitorToken() },
  });
}

// "有用"票数 +1(去重版,自动注入访客 token)
export function markReviewHelpful(id) {
  return request({
    url: `/valbri/reviews/${id}/helpful`,
    method: "post",
    headers: { "X-Voter-Token": getVisitorToken() },
  });
}

// 匿名访客的 voter token — UUID 持久化到 localStorage
const VISITOR_TOKEN_STORAGE_KEY = "valbri_voter_token";

function getVisitorToken() {
  let token = safeGetItem(VISITOR_TOKEN_STORAGE_KEY);
  if (!token || !/^[A-Za-z0-9_-]{8,64}$/.test(token)) {
    token = generateVisitorToken();
    safeSetItem(VISITOR_TOKEN_STORAGE_KEY, token);
  }
  return token;
}

function generateVisitorToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback:32 字符随机串
  let s = "";
  for (let i = 0; i < 32; i += 1) {
    s += Math.floor(Math.random() * 36).toString(36);
  }
  return s;
}
