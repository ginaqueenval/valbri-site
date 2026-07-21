import { useCallback, useEffect, useState } from "react";
import { getPlayerCaptcha } from "../api/auth";

export default function useCaptcha() {
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaUuid, setCaptchaUuid] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState("");
  const [captchaEnabled, setCaptchaEnabled] = useState(true);

  const loadCaptcha = useCallback(async () => {
    try {
      const res = await getPlayerCaptcha();
      const enabled = res.captchaEnabled !== false;
      setCaptchaEnabled(enabled);
      if (enabled) {
        setCaptchaUrl(`data:image/jpeg;base64,${res.img}`);
        setCaptchaUuid(res.uuid || "");
      } else {
        setCaptchaUrl("");
        setCaptchaUuid("");
      }
      setCaptchaCode("");
    } catch {
      setCaptchaEnabled(false);
      setCaptchaUrl("");
      setCaptchaUuid("");
    }
  }, []);

  useEffect(() => {
    // Initial captcha load. setState happens inside loadCaptcha's async
    // callback, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCaptcha();
  }, [loadCaptcha]);

  return {
    captchaCode,
    setCaptchaCode,
    captchaUuid,
    captchaUrl,
    captchaEnabled,
    loadCaptcha,
  };
}
