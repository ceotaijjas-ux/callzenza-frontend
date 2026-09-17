import { useEffect, useState } from "react";

function format(now) {
  const datePart = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

/** Live-updating "Thu, Aug 27 11:06:40 AM" style clock string, ticking every second. */
export default function useClock() {
  const [label, setLabel] = useState(() => format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setLabel(format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return label;
}
