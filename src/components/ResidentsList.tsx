import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";

interface Resident {
  id: string;
  full_name: string;
  flat_number: string;
  phone_number: string;
  created_at: string;
}

const ResidentsList = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          flat_number, 
          phone_number, 
          created_at,
          user_roles!inner(role)
        `)
        .eq("user_roles.role", "resident")
        .order("flat_number", { ascending: true });

      if (error) throw error;
      setResidents(data || []);
    } catch (error) {
      console.error("Error fetching residents:", error);
    } finally {
      setIsLoading(false);
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
          <Users className="h-5 w-5 text-primary" />
          All Residents
        </CardTitle>
        <CardDescription>
          Complete list of residents with flat numbers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {residents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No residents found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Flat Number</TableHead>
                  <TableHead>Phone Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">{resident.full_name || "N/A"}</TableCell>
                    <TableCell>{resident.flat_number || "N/A"}</TableCell>
                    <TableCell>{resident.phone_number || "N/A"}</TableCell>
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

export default ResidentsList;
