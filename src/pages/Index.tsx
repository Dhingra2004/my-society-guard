import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, UserCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  // One-time seeding for Super Admin if not present
  useEffect(() => {
    const runSeed = async () => {
      try {
        const seededFlag = localStorage.getItem('seed_super_admin_done');
        if (seededFlag) return;
        
        console.log('Attempting to seed super admin...');
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: 'amarpreetpic@gmail.com',
            password: 'Amar832108',
            role: 'super_admin',
            fullName: 'Super Admin',
          },
        });
        
        // Set flag regardless of outcome to avoid spamming
        localStorage.setItem('seed_super_admin_done', '1');
        
        if (error) {
          console.warn('Seed error:', error);
        } else {
          console.log('Super admin seeded successfully:', data);
        }
      } catch (e) {
        console.warn('Seed exception:', e);
      }
    };
    runSeed();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            SocietySecure
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Modern society management made simple. Secure visitor access, efficient complaint handling, and seamless communication.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Admin Card */}
          <Card className="group p-8 hover:shadow-elevated transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-card border-2 hover:border-primary"
            onClick={() => navigate("/auth?role=admin")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Admin</h3>
              <p className="text-muted-foreground">
                Manage users, monitor activities, handle complaints, and post important notices
              </p>
              <Button className="w-full mt-4 bg-gradient-primary hover:shadow-glow transition-all">
                Admin Access
              </Button>
            </div>
          </Card>

          {/* Guard Card */}
          <Card className="group p-8 hover:shadow-elevated transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-card border-2 hover:border-accent"
            onClick={() => navigate("/auth?role=guard")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Shield className="h-12 w-12 text-accent" />
              </div>
              <h3 className="text-2xl font-bold">Security Guard</h3>
              <p className="text-muted-foreground">
                Log visitor details, send entry requests, and maintain security records
              </p>
              <Button variant="secondary" className="w-full mt-4 hover:bg-accent hover:text-accent-foreground transition-all">
                Guard Access
              </Button>
            </div>
          </Card>

          {/* Resident Card */}
          <Card className="group p-8 hover:shadow-elevated transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-card border-2 hover:border-success"
            onClick={() => navigate("/auth?role=resident")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors">
                <UserCircle className="h-12 w-12 text-success" />
              </div>
              <h3 className="text-2xl font-bold">Resident</h3>
              <p className="text-muted-foreground">
                Approve visitor requests, register complaints, and view society notices
              </p>
              <Button variant="outline" className="w-full mt-4 border-success text-success hover:bg-success hover:text-success-foreground transition-all">
                Resident Access
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-card">
              <h3 className="text-xl font-semibold mb-2">🔔 Real-time Notifications</h3>
              <p className="text-muted-foreground">
                Instant alerts for visitor requests and important updates
              </p>
            </Card>
            <Card className="p-6 bg-gradient-card">
              <h3 className="text-xl font-semibold mb-2">🔐 Role-based Access</h3>
              <p className="text-muted-foreground">
                Secure authentication with customized access for each role
              </p>
            </Card>
            <Card className="p-6 bg-gradient-card">
              <h3 className="text-xl font-semibold mb-2">📝 Complaint Management</h3>
              <p className="text-muted-foreground">
                Efficient tracking and resolution of maintenance issues
              </p>
            </Card>
            <Card className="p-6 bg-gradient-card">
              <h3 className="text-xl font-semibold mb-2">📢 Notice Board</h3>
              <p className="text-muted-foreground">
                Digital announcements visible to all residents
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
