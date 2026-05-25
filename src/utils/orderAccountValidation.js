const DIGITS_ONLY = /^[0-9]+$/;

export const validateOrderAccountForm = (form) => {
  const data = {
    gameAccount: String(form?.gameAccount || "").trim(),
    gamePassword: String(form?.gamePassword || "").trim(),
    backupCodes: String(form?.backupCodes || "").trim(),
  };

  if (!data.gameAccount || !data.gamePassword || !data.backupCodes) {
    return { valid: false, errorKey: "required" };
  }

  if (!DIGITS_ONLY.test(data.backupCodes)) {
    return { valid: false, errorKey: "backupCodesNumeric" };
  }

  return { valid: true, data };
};
