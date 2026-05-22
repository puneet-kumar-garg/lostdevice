import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Hash, Shield, ArrowLeft, Check, Mail, Edit, ExternalLink } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

interface DeviceReport {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  brand: string;
  model: string;
  imei: string | null;
  serial_number: string | null;
  uuid_identifier: string | null;
  lost_date: string;
  last_location: string;
  description: string | null;
  status: string;
  front_image_url: string | null;
  back_image_url: string | null;
  invoice_image_url: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const messageSchema = z.object({
  message: z.string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z.string()
    .trim()
    .regex(/^[0-9+\s()-]*$/, "Phone number can only contain numbers, +, spaces, parentheses, and hyphens")
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal('')),
});

// device detail page v3
export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [device, setDevice] = useState<DeviceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    fetchDevice();
  }, [id]);

  const fetchDevice = async () => {
    try {
      const { data, error } = await supabase
        .from("device_reports")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setDevice(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load device details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFound = async () => {
    if (!session || !device || device.user_id !== session.user.id) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("device_reports")
        .update({ status: "found" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated!",
        description: "Your device has been marked as found.",
      });
      fetchDevice();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!session || !device) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to send a message.",
      });
      navigate("/auth");
      return;
    }

    setSendingMessage(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        message: formData.get("message") as string,
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || "",
      };

      const validated = messageSchema.parse(data);

      const { error } = await supabase.from("messages").insert({
        sender_id: session.user.id,
        receiver_id: device.user_id,
        device_report_id: device.id,
        message: validated.message,
        sender_name: validated.name,
        sender_email: validated.email,
        sender_phone: validated.phone || null,
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "The owner will be able to see your message and contact you.",
      });
      setDialogOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send message",
          description: error.message,
        });
      }
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading device details...</p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">Device not found</p>
        <Button onClick={() => navigate("/search")}>Back to Search</Button>
      </div>
    );
  }

  const isOwner = session?.user.id === device.user_id;
  const images = [
    device.front_image_url,
    device.back_image_url,
    device.invoice_image_url,
  ].filter(Boolean) as string[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{device.device_name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {device.brand} {device.model} • {device.device_type}
                  </CardDescription>
                </div>
                <Badge
                  variant={device.status === "found" ? "default" : "destructive"}
                  className="text-sm"
                >
                  {device.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {images.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {images.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block"
                    >
                      <img
                        src={url}
                        alt={`Device image ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg transition-opacity group-hover:opacity-90"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                        <ExternalLink className="h-8 w-8 text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {device.description || "No description provided"}
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lost Date</p>
                    <p className="font-medium">
                      {new Date(device.lost_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Location</p>
                    <p className="font-medium">{device.last_location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Device Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {device.imei && (
                  <div>
                    <p className="text-sm text-muted-foreground">IMEI</p>
                    <p className="font-mono font-medium">{device.imei}</p>
                  </div>
                )}
                {device.serial_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-mono font-medium">{device.serial_number}</p>
                  </div>
                )}
                {device.uuid_identifier && (
                  <div>
                    <p className="text-sm text-muted-foreground">UUID</p>
                    <p className="font-mono font-medium break-all">{device.uuid_identifier}</p>
                  </div>
                )}
                {!device.imei && !device.serial_number && !device.uuid_identifier && (
                  <p className="text-muted-foreground">No identifiers provided</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {device.profiles?.full_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{device.profiles.full_name}</p>
                </div>
              )}
              {device.profiles?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{device.profiles.email}</p>
                </div>
              )}
              {device.profiles?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{device.profiles.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Reported</p>
                <p className="font-medium">
                  {new Date(device.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {!isOwner && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Owner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact Device Owner</DialogTitle>
                  <DialogDescription>
                    Send a message to the owner of this device. They will see your contact information.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name * (2-100 characters)</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email * (max 255 characters)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      maxLength={255}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Your Phone (optional, max 20 characters)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      maxLength={20}
                      placeholder="+1 234 567 8900"
                      pattern="[0-9+\s()-]*"
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[^0-9+\s()-]/g, '');
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message * (10-1000 characters)</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      minLength={10}
                      maxLength={1000}
                      placeholder="I found your device..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={sendingMessage}>
                    {sendingMessage ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {isOwner && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate(`/device/${id}/edit`)}
                variant="outline"
                className="w-full"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
              {device.status === "lost" && (
                <Button
                  onClick={handleMarkAsFound}
                  disabled={updating}
                  className="w-full"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {updating ? "Updating..." : "Mark as Found"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
