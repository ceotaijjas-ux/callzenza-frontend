"use client";
/**
 * Thin styling wrapper — pass real <thead>/<tbody> children so callers keep
 * full control of columns/rows per panel.
 */
export function TableWrap({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.8px]">{children}</table>
    </div>
  );
}

export function Th({ children }) {
  return (
    <th className="text-left text-[11px] uppercase tracking-[.04em] text-text-tertiary px-3 py-[9px] border-b border-border whitespace-nowrap">
      {children}
    </th>
  );
}

export function Td({ children, className = "" }) {
  return (
    <td className={`px-3 py-[11px] border-b border-border align-middle last:border-b-0 ${className}`}>
      {children}
    </td>
  );
}

export function TdSubtle({ children }) {
  return <span className="text-text-tertiary text-[11.5px]">{children}</span>;
}
