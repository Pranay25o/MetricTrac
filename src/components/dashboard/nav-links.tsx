// src/components/dashboard/nav-links.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookUser,
  BookOpenCheck,
  GraduationCap,
  ClipboardEdit,
  BarChart3,
  FileCog,
  NotebookPen,
  Presentation,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher", "student"] },
  // Admin specific
  { href: "/dashboard/admin/students", label: "Manage Students", icon: Users, roles: ["admin"] },
  { href: "/dashboard/admin/teachers", label: "Manage Teachers", icon: BookUser, roles: ["admin"] },
  { href: "/dashboard/admin/subjects", label: "Manage Subjects", icon: BookOpenCheck, roles: ["admin"] },
  { href: "/dashboard/admin/semesters", label: "Manage Semesters", icon: GraduationCap, roles: ["admin"] },
  { href: "/dashboard/admin/assign-subjects", label: "Assign Subjects", icon: FileCog, roles: ["admin"] },
  // Teacher specific
  { href: "/dashboard/teacher/manage-marks", label: "Manage Marks", icon: ClipboardEdit, roles: ["teacher"] },
  { href: "/dashboard/teacher/view-students", label: "View Students", icon: Presentation, roles: ["teacher"] },
  // Student specific
  { href: "/dashboard/student/my-marks", label: "My Marks", icon: NotebookPen, roles: ["student"] },
  { href: "/dashboard/student/performance-analysis", label: "Performance Analysis", icon: BarChart3, roles: ["student"] },
];

export function NavLinks({ userRole }: { userRole: Role | null }) {
  const pathname = usePathname();

  if (!userRole) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
