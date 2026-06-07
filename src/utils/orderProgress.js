import {
  isPaidPaymentStatus,
  normalizeDeliveryStatus,
  normalizePaymentStatus,
} from "./orderDisplay";

export const ORDER_PROGRESS_STEPS = [
  "submitted",
  "paid",
  "accountInfo",
  "processing",
  "completed",
];

export const isAccountInfoMissing = (order) =>
  isPaidPaymentStatus(order?.payStatus) &&
  (Boolean(order?.requiresAccountInfo) || order?.accountInfoStatus === "missing");

export const getPlayerOrderProgress = (order) => {
  const payStatus = normalizePaymentStatus(order?.payStatus);
  const deliveryStatus = normalizeDeliveryStatus(order?.deliveryStatus);

  if (payStatus === "2") {
    return {
      statusKey: "cancelled",
      descKey: "cancelledDesc",
      tabKey: "closed",
      tone: "muted",
      progressPercent: 20,
      completedStepIndexes: [0],
    };
  }

  if (payStatus === "3") {
    return {
      statusKey: "refunded",
      descKey: "refundedDesc",
      tabKey: "closed",
      tone: "danger",
      progressPercent: 40,
      completedStepIndexes: [0, 1],
    };
  }

  if (payStatus !== "1") {
    return {
      statusKey: "pendingPayment",
      descKey: "pendingPaymentDesc",
      tabKey: "pendingPayment",
      tone: "warning",
      progressPercent: 20,
      completedStepIndexes: [0],
    };
  }

  if (deliveryStatus === "2") {
    return {
      statusKey: "completed",
      descKey: "completedDesc",
      tabKey: "completed",
      tone: "success",
      progressPercent: 100,
      completedStepIndexes: [0, 1, 2, 3, 4],
    };
  }

  if (isAccountInfoMissing(order)) {
    return {
      statusKey: "accountRequired",
      descKey: "accountRequiredDesc",
      tabKey: "accountRequired",
      tone: "danger",
      progressPercent: 40,
      completedStepIndexes: [0, 1],
    };
  }

  if (deliveryStatus === "1") {
    return {
      statusKey: "processing",
      descKey: "processingDesc",
      tabKey: "processing",
      tone: "processing",
      progressPercent: 85,
      completedStepIndexes: [0, 1, 2, 3],
    };
  }

  return {
    statusKey: "waitingProcessing",
    descKey: "waitingProcessingDesc",
    tabKey: "processing",
    tone: "info",
    progressPercent: 70,
    completedStepIndexes: [0, 1, 2, 3],
  };
};

export const getPlayerOrderTabKey = (order) => getPlayerOrderProgress(order).tabKey;

export const matchesPlayerOrderTab = (order, tabKey) =>
  !tabKey || getPlayerOrderTabKey(order) === tabKey;
