import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Bell, Megaphone } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_urgent: boolean;
  created_at: string;
  admin_id: string;
}

interface NoticeBoardProps {
  isAdmin: boolean;
}

const NoticeBoard = ({ isAdmin }: NoticeBoardProps) => {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isUrgent: false,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("notices").insert({
        admin_id: user.id,
        title: formData.title,
        content: formData.content,
        is_urgent: formData.isUrgent,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notice posted successfully",
      });

      setFormData({
        title: "",
        content: "",
        isUrgent: false,
      });

      fetchNotices();
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

  const handleDelete = async (noticeId: string) => {
    try {
      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", noticeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notice deleted",
      });

      fetchNotices();
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
      {isAdmin && (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Post New Notice
            </CardTitle>
            <CardDescription>
              Create announcements for all residents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notice Title</Label>
                <Input
                  id="title"
                  placeholder="Enter notice title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter notice content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={5}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="urgent"
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isUrgent: checked })
                  }
                />
                <Label htmlFor="urgent">Mark as urgent</Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow"
                disabled={isLoading}
              >
                Post Notice
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Society Notices
          </CardTitle>
          <CardDescription>Important announcements and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No notices available
              </p>
            ) : (
              notices.map((notice) => (
                <Card
                  key={notice.id}
                  className={`${
                    notice.is_urgent
                      ? "border-warning bg-warning/5"
                      : "bg-gradient-card"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{notice.title}</h3>
                        {notice.is_urgent && (
                          <Badge variant="destructive" className="animate-pulse">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {notice.content}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Posted: {format(new Date(notice.created_at), "PPp")}
                        </p>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notice.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoticeBoard;
