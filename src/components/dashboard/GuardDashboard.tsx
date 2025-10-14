import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, UserPlus, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface GuardDashboardProps {
  user: User;
}

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  flat_number: string;
  status: string;
  created_at: string;
}

const GuardDashboard = ({ user }: GuardDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [formData, setFormData] = useState({
    visitorName: "",
    visitorPhone: "",
    purpose: "",
    flatNumber: "",
  });

  useEffect(() => {
    fetchVisitors();
    
    // Set up real-time subscription
    const channel = supabase
      .channel("visitors-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitors",
        },
        () => {
          fetchVisitors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVisitors = async () => {
    try {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setVisitors(data || []);
    } catch (error: any) {
      console.error("Error fetching visitors:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, get the resident's user_id based on flat number
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("flat_number", formData.flatNumber)
        .maybeSingle();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "No resident found with this flat number",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("visitors").insert({
        visitor_name: formData.visitorName,
        visitor_phone: formData.visitorPhone,
        purpose: formData.purpose,
        flat_number: formData.flatNumber,
        resident_id: profile.id,
        guard_id: user.id,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Visitor request sent to resident",
      });

      setFormData({
        visitorName: "",
        visitorPhone: "",
        purpose: "",
        flatNumber: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge className="bg-success">Approved</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Security Guard Portal
            </h1>
            <p className="text-muted-foreground mt-2">Visitor Management System</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Visitor Entry Form */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Log New Visitor
              </CardTitle>
              <CardDescription>
                Enter visitor details and send entry request to resident
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visitorName">Visitor Name</Label>
                  <Input
                    id="visitorName"
                    placeholder="Enter visitor's full name"
                    value={formData.visitorName}
                    onChange={(e) =>
                      setFormData({ ...formData, visitorName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorPhone">Phone Number</Label>
                  <Input
                    id="visitorPhone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.visitorPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, visitorPhone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flatNumber">Flat Number</Label>
                  <Input
                    id="flatNumber"
                    placeholder="Enter flat number (e.g., A-101)"
                    value={formData.flatNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, flatNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Visit</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the purpose of visit"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:shadow-glow"
                  disabled={isLoading}
                >
                  Send Entry Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Visitors */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Recent Visitor Logs
              </CardTitle>
              <CardDescription>Latest visitor entries and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {visitors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No visitor entries yet
                  </p>
                ) : (
                  visitors.map((visitor) => (
                    <Card key={visitor.id} className="bg-gradient-card">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{visitor.visitor_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {visitor.visitor_phone}
                            </p>
                          </div>
                          {getStatusBadge(visitor.status)}
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Flat:</span> {visitor.flat_number}
                          </p>
                          <p>
                            <span className="font-medium">Purpose:</span> {visitor.purpose}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(visitor.created_at), "PPp")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GuardDashboard;
