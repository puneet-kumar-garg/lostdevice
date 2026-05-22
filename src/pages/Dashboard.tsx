import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Calendar, MapPin } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface DeviceReport {
  id: string;
  device_name: string;
  device_type: string;
  brand: string;
  model: string;
  status: string;
  lost_date: string;
  last_location: string;
  created_at: string;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

// dashboard page v2
export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<DeviceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
      fetchProfile(session.user.id);
      fetchReports(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchReports(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Failed to load profile:", error);
    }
  };

  const fetchReports = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("device_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your reports. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (session?.user?.user_metadata?.full_name) return session.user.user_metadata.full_name;
    if (session?.user?.user_metadata?.name) return session.user.user_metadata.name;
    if (session?.user?.email) return session.user.email.split('@')[0];
    return "User";
  };

  const getUserEmail = () => {
    return profile?.email || session?.user?.email || "";
  };

  const getUserAvatar = () => {
    return profile?.avatar_url ||
           session?.user?.user_metadata?.avatar_url || 
           session?.user?.user_metadata?.picture;
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* User Profile Section */}
        {session?.user && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                  <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold">{getUserDisplayName()}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground break-all">{getUserEmail()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Device Reports</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and track your lost device reports
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate("/search")} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              <span className="sm:inline">Search</span>
            </Button>
            <Button onClick={() => navigate("/report")} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Report</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                You haven't reported any lost devices yet
              </p>
              <Button onClick={() => navigate("/report")}>
                <Plus className="mr-2 h-4 w-4" />
                Report Your First Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => navigate(`/device/${report.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{report.device_name}</CardTitle>
                    <Badge variant={report.status === "found" ? "default" : "destructive"}>
                      {report.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {report.brand} {report.model}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Lost: {new Date(report.lost_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{report.last_location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
