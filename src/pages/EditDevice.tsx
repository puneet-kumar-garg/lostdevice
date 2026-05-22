import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { ArrowLeft, Save } from "lucide-react";

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
}

// edit device page v2
export default function EditDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [device, setDevice] = useState<DeviceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
      fetchDevice(session.user.id);
    });
  }, [id, navigate]);

  const fetchDevice = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("device_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Verify ownership
      if (data.user_id !== userId) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You can only edit your own device reports.",
        });
        navigate("/dashboard");
        return;
      }

      setDevice(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load device details.",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session || !device) return;

    setUpdating(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        device_name: formData.get("device_name") as string,
        device_type: formData.get("device_type") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        imei: formData.get("imei") as string || null,
        serial_number: formData.get("serial_number") as string || null,
        uuid_identifier: formData.get("uuid_identifier") as string || null,
        lost_date: formData.get("lost_date") as string,
        last_location: formData.get("last_location") as string,
        description: formData.get("description") as string || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("device_reports")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Device updated!",
        description: "Your device report has been successfully updated.",
      });
      navigate(`/device/${id}`);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading device details...</p>
      </div>
    );
  }

  if (!device) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate(`/device/${id}`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Device
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Device Report</CardTitle>
          <CardDescription>
            Update the information about your lost device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="device_name">Device Name *</Label>
                <Input
                  id="device_name"
                  name="device_name"
                  defaultValue={device.device_name}
                  required
                  placeholder="My iPhone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_type">Device Type *</Label>
                <Input
                  id="device_type"
                  name="device_type"
                  defaultValue={device.device_type}
                  required
                  placeholder="Smartphone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  name="brand"
                  defaultValue={device.brand}
                  required
                  placeholder="Apple"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  name="model"
                  defaultValue={device.model}
                  required
                  placeholder="iPhone 14 Pro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lost_date">Lost Date *</Label>
                <Input
                  id="lost_date"
                  name="lost_date"
                  type="date"
                  defaultValue={device.lost_date}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_location">Last Known Location *</Label>
                <Input
                  id="last_location"
                  name="last_location"
                  defaultValue={device.last_location}
                  required
                  placeholder="Central Park, NYC"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Device Identifiers (Optional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI Number</Label>
                <Input
                  id="imei"
                  name="imei"
                  defaultValue={device.imei || ""}
                  placeholder="123456789012345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  defaultValue={device.serial_number || ""}
                  placeholder="C02ABC123XYZ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uuid_identifier">UUID</Label>
                <Input
                  id="uuid_identifier"
                  name="uuid_identifier"
                  defaultValue={device.uuid_identifier || ""}
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={device.description || ""}
                placeholder="Additional details about your device..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={updating} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/device/${id}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
