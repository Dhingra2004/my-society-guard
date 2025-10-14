import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, AlertCircle, Bell, BarChart3, Shield } from "lucide-react";
import NoticeBoard from "@/components/NoticeBoard";
import ComplaintsList from "@/components/ComplaintsList";
import ResidentsList from "@/components/ResidentsList";
import VisitorsList from "@/components/VisitorsList";
import UserManagement from "@/components/UserManagement";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SuperAdminDashboardProps {
  user: User;
}

const SuperAdminDashboard = ({ user }: SuperAdminDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalResidents: 0,
    pendingComplaints: 0,
    pendingVisitors: 0,
    totalNotices: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [residents, complaints, visitors, notices] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact" }).eq("role", "resident"),
        supabase.from("complaints").select("*", { count: "exact" }).eq("status", "pending"),
        supabase.from("visitors").select("*", { count: "exact" }).eq("status", "pending"),
        supabase.from("notices").select("*", { count: "exact" }),
      ]);

      setStats({
        totalResidents: residents.count || 0,
        pendingComplaints: complaints.count || 0,
        pendingVisitors: visitors.count || 0,
        totalNotices: notices.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Full system access & user management</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="bg-gradient-card shadow-elevated cursor-pointer hover:shadow-glow transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalResidents}</div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Residents Directory</DialogTitle>
                <DialogDescription>
                  This is a list of all users with the resident role, including their flat numbers.
                </DialogDescription>
              </DialogHeader>
              <ResidentsList />
            </DialogContent>
          </Dialog>

          <Card className="bg-gradient-card shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingComplaints}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Visitors</CardTitle>
              <Bell className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.pendingVisitors}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Notices</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalNotices}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="notices">Notices</TabsTrigger>
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="complaints" className="space-y-6">
            <ComplaintsList isAdmin={true} />
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
            <NoticeBoard isAdmin={true} />
          </TabsContent>

          <TabsContent value="visitors" className="space-y-6">
            <VisitorsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
