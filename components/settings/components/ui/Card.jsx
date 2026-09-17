"use client";
export function Card({ className = "", children }) {
  return (
    <div
      className={`bg-card-bg border border-border rounded-[10px] shadow-card mb-[18px] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-5 py-4 border-b border-border flex-wrap ${className}`}
    >
      {children}
    </div>
  );
}

/** icon: optional small icon component rendered in the accent-tinted square. */
export function CardTitle({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-[9px]">
      {Icon && (
        <div className="w-[26px] h-[26px] rounded-[7px] bg-accent-dim text-accent flex items-center justify-center shrink-0">
          <Icon className="w-[14px] h-[14px]" />
        </div>
      )}
      <div>
        <strong className="text-[14px] font-bold">{title}</strong>
        {description && (
          <span className="block text-[11.5px] text-text-tertiary font-normal mt-[1px]">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`px-5 py-[18px] ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-5 py-[14px] border-t border-border bg-[#fafafd] flex-wrap ${className}`}
    >
      {children}
    </div>
  );
}
