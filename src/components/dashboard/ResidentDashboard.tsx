import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Bell, AlertCircle, FileText, UserPlus } from "lucide-react";
import VisitorRequests from "@/components/VisitorRequests";
import ComplaintForm from "@/components/ComplaintForm";
import ComplaintsList from "@/components/ComplaintsList";
import NoticeBoard from "@/components/NoticeBoard";
import PreRegisterGuest from "@/components/PreRegisterGuest";

interface ResidentDashboardProps {
  user: User;
}

const ResidentDashboard = ({ user }: ResidentDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingVisitors, setPendingVisitors] = useState(0);

  useEffect(() => {
    fetchPendingCount();

    // Set up real-time subscription for visitors to this resident's flat
    const setupRealtimeSubscription = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("flat_number")
        .eq("id", user.id)
        .single();

      if (!profile?.flat_number) return;

      const channel = supabase
        .channel("resident-visitors")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "visitors",
            filter: `flat_number=eq.${profile.flat_number}`,
          },
          () => {
            fetchPendingCount();
          }
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setupRealtimeSubscription();

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [user.id]);

  const fetchPendingCount = async () => {
    try {
      // Get user's flat number first
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("flat_number")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.flat_number) {
        setPendingVisitors(0);
        return;
      }

      // Count pending visitors for this flat
      const { count, error } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("flat_number", profile.flat_number)
        .eq("status", "pending");

      if (error) throw error;
      setPendingVisitors(count || 0);
    } catch (error) {
      console.error("Error fetching pending visitors:", error);
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
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Resident Portal
            </h1>
            <p className="text-muted-foreground mt-2">Manage your visitors and complaints</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Pending Notifications Alert */}
        {pendingVisitors > 0 && (
          <Card className="mb-8 border-warning bg-warning/5 shadow-elevated animate-fade-in">
            <CardContent className="flex items-center gap-4 pt-6">
              <Bell className="h-8 w-8 text-warning animate-pulse" />
              <div>
                <p className="font-semibold text-lg">
                  You have {pendingVisitors} pending visitor request{pendingVisitors > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please review and approve or deny the entry requests
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="visitors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="visitors" className="relative">
              <Bell className="mr-2 h-4 w-4" />
              Visitors
              {pendingVisitors > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-warning text-warning-foreground text-xs flex items-center justify-center">
                  {pendingVisitors}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="preregister">
              <UserPlus className="mr-2 h-4 w-4" />
              Pre-Register
            </TabsTrigger>
            <TabsTrigger value="complaints">
              <AlertCircle className="mr-2 h-4 w-4" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="notices">
              <FileText className="mr-2 h-4 w-4" />
              Notices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visitors" className="space-y-6">
            <VisitorRequests userId={user.id} />
          </TabsContent>

          <TabsContent value="preregister" className="space-y-6">
            <PreRegisterGuest userId={user.id} />
          </TabsContent>

          <TabsContent value="complaints" className="space-y-6">
            <ComplaintForm userId={user.id} />
            <ComplaintsList isAdmin={false} userId={user.id} />
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
            <NoticeBoard isAdmin={false} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResidentDashboard;
