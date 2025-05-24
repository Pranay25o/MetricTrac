
// src/app/dashboard/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-provider";
import { BarChart, BookUser, GraduationCap, Users, NotebookPen, ClipboardEdit, Presentation, Building, Activity } from "lucide-react";
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
          description: "Oversee and manage all aspects of the MeritTrac system.",
          quickLinks: [
            { href: "/dashboard/admin/students", label: "Manage Students", icon: Users, color: "bg-blue-500 hover:bg-blue-600" },
            { href: "/dashboard/admin/teachers", label: "Manage Teachers", icon: BookUser, color: "bg-green-500 hover:bg-green-600" },
            { href: "/dashboard/admin/subjects", label: "Manage Subjects", icon: NotebookPen, color: "bg-purple-500 hover:bg-purple-600" },
            { href: "/dashboard/admin/semesters", label: "Manage Semesters", icon: GraduationCap, color: "bg-red-500 hover:bg-red-600" },
            { href: "/dashboard/admin/assign-subjects", label: "Assign Subjects", icon: ClipboardEdit, color: "bg-yellow-500 hover:bg-yellow-600" },
          ]
        };
      case "teacher":
        return {
          title: `Hello, Professor ${user.name}!`,
          description: "Manage student marks and view their academic progress.",
           quickLinks: [
            { href: "/dashboard/teacher/manage-marks", label: "Manage Marks", icon: ClipboardEdit, color: "bg-indigo-500 hover:bg-indigo-600" },
            { href: "/dashboard/teacher/view-students", label: "View My Students", icon: Presentation, color: "bg-pink-500 hover:bg-pink-600" },
          ]
        };
      case "student":
        return {
          title: `Hi ${user.name}, welcome back!`,
          description: "Access your marks, track your progress, and get AI-powered insights.",
          quickLinks: [
            { href: "/dashboard/student/my-marks", label: "My Marks", icon: NotebookPen, color: "bg-teal-500 hover:bg-teal-600" },
            { href: "/dashboard/student/performance-analysis", label: "AI Performance Analysis", icon: BarChart, color: "bg-orange-500 hover:bg-orange-600" },
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
    <div className="space-y-8">
      <Card className="shadow-xl border-primary border-l-4">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-primary">{title}</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground">
              Use the sidebar to navigate to different sections or use the quick links below for common tasks. 
              MeritTrac is designed to streamline academic record management and provide valuable insights.
            </p>
        </CardContent>
      </Card>

      {quickLinks && quickLinks.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link href={link.href} key={link.href} passHref>
                  <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 ${link.color} text-primary-foreground`}>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center h-40">
                      <Icon className="h-12 w-12 mb-3" />
                      <span className="text-lg font-medium">{link.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campus Updates</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <Image 
                  src="https://placehold.co/600x300.png" 
                  alt="Campus Life" 
                  width={600} 
                  height={300} 
                  className="rounded-lg object-cover w-full"
                  data-ai-hint="university campus" 
                />
                <p className="text-xs text-muted-foreground mt-2">Latest news and events from around the campus.</p>
            </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Image 
                src="https://placehold.co/600x300.png" 
                alt="System Analytics" 
                width={600} 
                height={300} 
                className="rounded-lg object-cover w-full"
                data-ai-hint="data analytics" 
            />
            <p className="text-xs text-muted-foreground mt-2">An overview of recent system interactions.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
             <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">You have no new notifications at this time.</p>
            <Button variant="outline" size="sm" className="w-full">View All Notifications</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

