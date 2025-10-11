import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, User, Phone, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  flat_number: string;
  status: string;
  created_at: string;
  notes?: string;
}

interface VisitorRequestsProps {
  userId: string;
}

const VisitorRequests = ({ userId }: VisitorRequestsProps) => {
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, [userId]);

  const fetchVisitors = async () => {
    try {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("resident_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (visitorId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("visitors")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", visitorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Visitor entry approved",
      });

      fetchVisitors();
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

  const handleDeny = async (visitorId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("visitors")
        .update({ status: "denied" })
        .eq("id", visitorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Visitor entry denied",
      });

      fetchVisitors();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="animate-pulse">Pending</Badge>;
      case "approved":
        return <Badge className="bg-success">Approved</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingVisitors = visitors.filter((v) => v.status === "pending");
  const otherVisitors = visitors.filter((v) => v.status !== "pending");

  return (
    <div className="space-y-6">
      {pendingVisitors.length > 0 && (
        <Card className="shadow-elevated border-warning">
          <CardHeader>
            <CardTitle className="text-warning">Pending Visitor Requests</CardTitle>
            <CardDescription>Approve or deny entry for these visitors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingVisitors.map((visitor) => (
              <Card key={visitor.id} className="bg-gradient-card border-2 border-warning/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-lg">{visitor.visitor_name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {visitor.visitor_phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Purpose:</span> {visitor.purpose}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(visitor.created_at), "PPp")}
                      </div>
                    </div>
                    {getStatusBadge(visitor.status)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleApprove(visitor.id)}
                      disabled={isLoading}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDeny(visitor.id)}
                      disabled={isLoading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {otherVisitors.length > 0 && (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Visitor History</CardTitle>
            <CardDescription>Previously handled visitor requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherVisitors.map((visitor) => (
              <Card key={visitor.id} className="bg-gradient-card">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{visitor.visitor_name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {visitor.visitor_phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        {visitor.purpose}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(visitor.created_at), "PPp")}
                      </div>
                    </div>
                    {getStatusBadge(visitor.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {visitors.length === 0 && (
        <Card className="shadow-elevated">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No visitor requests yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisitorRequests;
