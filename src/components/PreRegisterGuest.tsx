import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Calendar, Trash2, User, Phone, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PreRegisteredGuest {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  expected_date_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface PreRegisterGuestProps {
  userId: string;
}

const PreRegisterGuest = ({ userId }: PreRegisterGuestProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preRegisteredGuests, setPreRegisteredGuests] = useState<PreRegisteredGuest[]>([]);
  const [formData, setFormData] = useState({
    visitorName: "",
    visitorPhone: "",
    purpose: "",
    expectedDateTime: "",
    notes: "",
  });

  useEffect(() => {
    fetchPreRegisteredGuests();
  }, [userId]);

  const fetchPreRegisteredGuests = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("flat_number")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      if (!profile?.flat_number) return;

      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("flat_number", profile.flat_number)
        .eq("status", "approved")
        .not("expected_date_time", "is", null)
        .order("expected_date_time", { ascending: true });

      if (error) throw error;
      setPreRegisteredGuests(data || []);
    } catch (error: any) {
      console.error("Error fetching pre-registered guests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get user's flat number
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("flat_number")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      if (!profile?.flat_number) {
        throw new Error("Your profile doesn't have a flat number assigned");
      }

      // Insert pre-approved visitor
      const { error } = await supabase
        .from("visitors")
        .insert({
          visitor_name: formData.visitorName,
          visitor_phone: formData.visitorPhone,
          purpose: formData.purpose,
          expected_date_time: formData.expectedDateTime,
          notes: formData.notes,
          flat_number: profile.flat_number,
          resident_id: userId,
          guard_id: userId, // Temporary, will be updated when guard logs entry
          status: "approved", // Pre-approved by resident
          approved_at: new Date().toISOString(),
          approved_by_resident_id: userId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Guest pre-registered successfully. Guards can now see this entry.",
      });

      // Reset form and refresh list
      setFormData({
        visitorName: "",
        visitorPhone: "",
        purpose: "",
        expectedDateTime: "",
        notes: "",
      });
      fetchPreRegisteredGuests();
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

  const handleRevokeAccess = async (guestId: string, guestName: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${guestName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("visitors")
        .update({ status: "denied" })
        .eq("id", guestId);

      if (error) throw error;

      toast({
        title: "Access Revoked",
        description: `Access revoked for ${guestName}`,
      });

      fetchPreRegisteredGuests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-elevated bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-accent" />
          Pre-Register Guest
        </CardTitle>
        <CardDescription>
          Add guest details in advance. Guards will be notified when the guest arrives.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitorName">Visitor Name *</Label>
              <Input
                id="visitorName"
                type="text"
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                placeholder="Enter visitor's full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitorPhone">Phone Number *</Label>
              <Input
                id="visitorPhone"
                type="tel"
                value={formData.visitorPhone}
                onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                placeholder="+1234567890"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Visit *</Label>
              <Input
                id="purpose"
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Delivery, Guest, Service"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDateTime" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expected Date & Time *
              </Label>
              <Input
                id="expectedDateTime"
                type="datetime-local"
                value={formData.expectedDateTime}
                onChange={(e) => setFormData({ ...formData, expectedDateTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions or additional information..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering Guest...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Pre-Register Guest
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* Pre-Registered Guests List */}
    {preRegisteredGuests.length > 0 && (
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            Your Pre-Registered Guests
          </CardTitle>
          <CardDescription>
            Manage your upcoming pre-approved visitors. You can revoke access anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preRegisteredGuests.map((guest) => (
            <Card key={guest.id} className="bg-gradient-card">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-lg">{guest.visitor_name}</h3>
                      <Badge className="bg-success">Pre-Approved</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {guest.visitor_phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Purpose:</span> {guest.purpose}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-accent">
                      <Calendar className="h-4 w-4" />
                      Expected: {format(new Date(guest.expected_date_time), "PPp")}
                    </div>
                    {guest.notes && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Notes:</span> {guest.notes}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Registered: {format(new Date(guest.created_at), "PPp")}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeAccess(guest.id, guest.visitor_name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    )}
  </div>
  );
};

export default PreRegisterGuest;
