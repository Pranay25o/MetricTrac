
// src/app/dashboard/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-provider";
import { getUsers } from "@/lib/firestore/users"; // Import getUsers
import type { UserProfile } from "@/lib/types";
import { BarChart, BookUser, GraduationCap, Users, NotebookPen, ClipboardEdit, Presentation, UsersRound, Loader2, Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react"; // Import useEffect, useState, useCallback

export default function DashboardPage() {
  const { user } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalTeachers, setTotalTeachers] = useState<number | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  const fetchUserCounts = useCallback(async () => {
    console.log("DashboardPage: fetchUserCounts triggered");
    setIsLoadingCounts(true);
    try {
      const allUsers = await getUsers();
      const students = await getUsers("student");
      const teachers = await getUsers("teacher");
      
      setTotalUsers(allUsers.length);
      setTotalStudents(students.length);
      setTotalTeachers(teachers.length);
      console.log("DashboardPage: User counts fetched - Total:", allUsers.length, "Students:", students.length, "Teachers:", teachers.length);
    } catch (error) {
      console.error("Error fetching user counts:", error);
      // Optionally set an error state or show a toast
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    if (user) { // Fetch counts if user is loaded
      fetchUserCounts();
    }
  }, [user, fetchUserCounts]);


  if (!user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading user data...</p></div>;
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

  let displayedCountCards = [];
  if (user.role === 'admin') {
    displayedCountCards = [
      { title: "Total Users", count: totalUsers, icon: UsersRound, color: "text-blue-600" },
      { title: "Total Students", count: totalStudents, icon: GraduationCap, color: "text-green-600" },
      { title: "Total Teachers", count: totalTeachers, icon: BookUser, color: "text-purple-600" },
    ];
  } else if (user.role === 'teacher') {
    displayedCountCards = [
      { title: "Total Students", count: totalStudents, icon: GraduationCap, color: "text-green-600" },
    ];
  } // Students don't see these count cards by default based on this logic

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-primary border-l-4">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-primary">{title}</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground">
              Navigate through MeritTrac using the sidebar or the quick actions below. This portal is designed to streamline academic record management and provide valuable insights for all users.
            </p>
        </CardContent>
      </Card>

      {displayedCountCards.length > 0 && (
        <div className={`grid gap-6 ${user.role === 'teacher' ? 'md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2' : 'md:grid-cols-3'}`}>
          {displayedCountCards.map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </CardHeader>
                <CardContent>
                  {isLoadingCounts ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <div className={`text-3xl font-bold ${item.color}`}>{item.count ?? "N/A"}</div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">
                    Current count of {item.title.toLowerCase()} in the system.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      {quickLinks && quickLinks.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link href={link.href} key={link.href} passHref>
                  <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 ${link.color} text-primary-foreground group`}>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-3">
                        <Icon className="h-7 w-7" /> 
                        {link.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity">Access the {link.label.toLowerCase()} section.</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
