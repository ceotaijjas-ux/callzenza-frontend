"use client";
import { CheckIcon } from "./Icons.jsx";

export default function Toast({ message, visible }) {
  return (
    <div
      className={`fixed bottom-[22px] right-[22px] bg-[#16161f] text-white px-[18px] py-3 rounded-[9px] text-[12.8px] font-semibold flex items-center gap-2 shadow-toast z-[100] transition-all duration-250 pointer-events-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
    >
      <CheckIcon className="w-[14px] h-[14px] text-success" />
      <span>{message}</span>
    </div>
  );
}
