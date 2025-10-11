import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

interface Complaint {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resident_id: string;
}

interface ComplaintsListProps {
  isAdmin: boolean;
  userId?: string;
}

const ComplaintsList = ({ isAdmin, userId }: ComplaintsListProps) => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    fetchComplaints();
  }, [userId]);

  const fetchComplaints = async () => {
    try {
      let query = supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin && userId) {
        query = query.eq("resident_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          status: newStatus as any,
          resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
        })
        .eq("id", complaintId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Complaint status updated",
      });

      fetchComplaints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-primary">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-success">Resolved</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          {isAdmin ? "All Complaints" : "My Complaints"}
        </CardTitle>
        <CardDescription>
          {isAdmin ? "Manage all society complaints" : "Track your submitted complaints"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No complaints found
            </p>
          ) : (
            complaints.map((complaint) => (
              <Card key={complaint.id} className="bg-gradient-card">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(complaint.category)}
                        </Badge>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <h3 className="font-semibold text-lg">{complaint.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {complaint.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(complaint.created_at), "PPp")}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm font-medium mb-2 block">
                        Update Status
                      </Label>
                      <Select
                        value={complaint.status}
                        onValueChange={(value) =>
                          handleStatusUpdate(complaint.id, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplaintsList;
