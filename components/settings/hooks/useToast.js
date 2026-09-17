import { useCallback, useRef, useState } from "react";

/**
 * Small toast controller. Returns { message, visible, showToast }.
 * showToast(msg) shows the toast and auto-hides it after 2.6s,
 * same timing as the original demo's showToast().
 */
export default function useToast() {
  const [message, setMessage] = useState("Changes saved");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((msg = "Changes saved") => {
    setMessage(msg);
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2600);
  }, []);

  return { message, visible, showToast };
}
