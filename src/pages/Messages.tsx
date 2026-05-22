import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Mail, Phone, User, Calendar, ExternalLink } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  message: string;
  created_at: string;
  device_report_id: string;
  device_reports: {
    device_name: string;
    status: string;
  };
}

// messages page v3
export default function Messages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
      fetchMessages(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          device_reports:device_report_id (
            device_name,
            status
          )
        `)
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);

      // Mark all messages as read
      const unreadIds = data?.filter(msg => !msg.is_read).map(msg => msg.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Inbox className="h-6 w-6 sm:h-8 sm:w-8" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Messages from people who found your devices
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No messages yet. When someone contacts you about your devices, they'll appear here.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              View My Reports
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Message about: {msg.device_reports.device_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(msg.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant={msg.device_reports.status === "found" ? "default" : "destructive"}>
                    {msg.device_reports.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Message:</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-semibold">Contact Information:</h4>
                  
                  {msg.sender_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{msg.sender_name}</span>
                    </div>
                  )}
                  
                  {msg.sender_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${msg.sender_email}`}
                        className="text-primary hover:underline"
                      >
                        {msg.sender_email}
                      </a>
                    </div>
                  )}
                  
                  {msg.sender_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${msg.sender_phone}`}
                        className="text-primary hover:underline"
                      >
                        {msg.sender_phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/device/${msg.device_report_id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Device Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
