import request from "../utils/request";

export function requestBeforeCompletion(orderId) {
  return request({ url: `/player/orders/${orderId}/refunds`, method: "post" });
}

export function requestAfterCompletion(orderId, data) {
  return request({ url: `/player/orders/${orderId}/refund-claims`, method: "post", data });
}

export function listRefundRequests() {
  return request({ url: "/player/refunds", method: "get" });
}

export function getRefundRequest(id) {
  return request({ url: `/player/refunds/${id}`, method: "get" });
}

export function uploadRefundEvidence(id, file) {
  const data = new FormData();
  data.append("file", file);
  return request({ url: `/player/refunds/${id}/evidence`, method: "post", data });
}

export function downloadRefundEvidence(id, evidenceId) {
  return request({
    url: `/player/refunds/${id}/evidence/${evidenceId}`,
    method: "get",
    responseType: "blob",
  });
}

export function createRefundChallenge(data) {
  return request({ url: "/public/refund-claims/challenges", method: "post", data });
}

export function verifyRefundChallenge(data) {
  return request({ url: "/public/refund-claims/challenges/verify", method: "post", data });
}

export function submitPublicRefundClaim(claimToken, data) {
  return request({
    url: "/public/refund-claims",
    method: "post",
    data,
    headers: { Authorization: `Bearer ${claimToken}` },
  });
}

export function uploadPublicRefundEvidence(claimToken, refundRequestId, file) {
  const data = new FormData();
  data.append("refundRequestId", refundRequestId);
  data.append("file", file);
  return request({
    url: "/public/refund-claims/evidence",
    method: "post",
    data,
    headers: { Authorization: `Bearer ${claimToken}` },
  });
}
