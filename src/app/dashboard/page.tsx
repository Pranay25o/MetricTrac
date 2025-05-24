// src/app/dashboard/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-provider";
import { BarChart, BookUser, GraduationCap, Users, NotebookPen, ClipboardEdit, Presentation } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <p>Loading user data...</p>;
  }

  const getRoleSpecificWelcome = () => {
    switch (user.role) {
      case "admin":
        return {
          title: `Welcome, Administrator ${user.name}!`,
          description: "Manage students, teachers, subjects, and overall system settings.",
          quickLinks: [
            { href: "/dashboard/admin/students", label: "Manage Students", icon: Users },
            { href: "/dashboard/admin/teachers", label: "Manage Teachers", icon: BookUser },
            { href: "/dashboard/admin/subjects", label: "Manage Subjects", icon: GraduationCap },
          ]
        };
      case "teacher":
        return {
          title: `Hello, Professor ${user.name}!`,
          description: "Input marks, view student progress, and manage your assigned subjects.",
           quickLinks: [
            { href: "/dashboard/teacher/manage-marks", label: "Manage Marks", icon: ClipboardEdit },
            { href: "/dashboard/teacher/view-students", label: "View Students", icon: Presentation },
          ]
        };
      case "student":
        return {
          title: `Hi ${user.name}, welcome back!`,
          description: "Check your marks, track your academic progress, and get performance insights.",
          quickLinks: [
            { href: "/dashboard/student/my-marks", label: "My Marks", icon: NotebookPen },
            { href: "/dashboard/student/performance-analysis", label: "Performance Analysis", icon: BarChart },
          ]
        };
      default:
        return {
          title: "Welcome to MeritTrac!",
          description: "Your campus marks portal."
        };
    }
  };

  const { title, description, quickLinks } = getRoleSpecificWelcome();

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{title}</CardTitle>
          <CardDescription className="text-lg">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full lg:col-span-2">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center gap-6">
                <Image 
                  src="https://placehold.co/600x400.png" 
                  alt="Dashboard illustration" 
                  width={300} 
                  height={200} 
                  className="rounded-lg object-cover"
                  data-ai-hint="education technology" 
                />
                <p className="text-muted-foreground">
                  MeritTrac provides a comprehensive platform for managing academic records. 
                  Navigate through your personalized dashboard to access relevant features and information.
                  Use the sidebar to explore different sections of the portal.
                </p>
              </CardContent>
            </Card>
            {quickLinks && quickLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickLinks.map(link => {
                    const Icon = link.icon;
                    return (
                      <Link href={link.href} key={link.href} passHref>
                        <Button variant="outline" className="w-full justify-start gap-3 text-left hover:bg-accent/10">
                          <Icon className="h-5 w-5 text-primary" />
                          <span>{link.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Placeholder for additional dashboard widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            {/* Future: List recent logins, marks updates, etc. */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You have no new notifications.</p>
            {/* Future: Display system announcements or alerts */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600">All systems operational.</p>
            {/* Future: Indicate system health or maintenance schedules */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
