"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // If on the login page, render children directly without admin shell
  if (pathname === "/super-admin/login") {
    return <>{children}</>;
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}
