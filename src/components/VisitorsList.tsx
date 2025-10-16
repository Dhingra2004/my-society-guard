import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users2 } from "lucide-react";
import { format } from "date-fns";

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  flat_number: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  expected_date_time?: string;
}

const VisitorsList = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVisitors();
    
    // Set up real-time subscription
    const channel = supabase
      .channel("admin-visitors-changes")
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error("Error fetching visitors:", error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-accent" />
          All Visitors
        </CardTitle>
        <CardDescription>
          Complete visitor logs with status and details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visitors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No visitor records found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Flat Number</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date/Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="font-medium">{visitor.visitor_name}</TableCell>
                    <TableCell>{visitor.visitor_phone}</TableCell>
                    <TableCell>{visitor.flat_number}</TableCell>
                    <TableCell className="max-w-xs truncate">{visitor.purpose}</TableCell>
                    <TableCell>{getStatusBadge(visitor.status)}</TableCell>
                    <TableCell className="text-sm">
                      {visitor.expected_date_time ? (
                        <div>
                          <div className="font-medium text-accent">
                            Expected: {format(new Date(visitor.expected_date_time), "PPp")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Requested: {format(new Date(visitor.created_at), "PPp")}
                          </div>
                        </div>
                      ) : (
                        format(new Date(visitor.created_at), "PPp")
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitorsList;
