import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, User, LogOut, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

// header component v2
export const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUnreadCount(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUnreadCount(session.user.id);
      } else {
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${session.user.id}`,
        },
        () => {
          fetchUnreadCount(session.user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchUnreadCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch message count:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            LostDevice
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
          {session ? (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="sm:hidden">
                <Link to="/dashboard">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild className="relative">
                <Link to="/messages">
                  <Inbox className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Messages</span>
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="sm:hidden">
                <Link to="/profile">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
