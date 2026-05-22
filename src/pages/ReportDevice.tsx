import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";

// report device page v3
export default function ReportDevice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    });
  }, [navigate]);

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${path}-${Math.random()}.${fileExt}`;
      const filePath = `${session!.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("device-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("device-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Upload images
      const frontImageUrl = frontImage ? await uploadImage(frontImage, "front") : null;
      const backImageUrl = backImage ? await uploadImage(backImage, "back") : null;
      const invoiceImageUrl = invoiceImage ? await uploadImage(invoiceImage, "invoice") : null;

      setUploading(false);

      const { error } = await supabase.from("device_reports").insert({
        user_id: session.user.id,
        device_name: formData.get("deviceName") as string,
        device_type: formData.get("deviceType") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        imei: formData.get("imei") as string || null,
        serial_number: formData.get("serialNumber") as string || null,
        uuid_identifier: formData.get("uuid") as string || null,
        lost_date: formData.get("lostDate") as string,
        last_location: formData.get("lastLocation") as string,
        description: formData.get("description") as string || null,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
        invoice_image_url: invoiceImageUrl,
      });

      if (error) throw error;

      toast({
        title: "Report submitted!",
        description: "Your device has been reported successfully.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Report Lost Device</CardTitle>
          <CardDescription>
            Fill in the details to report your lost device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  name="deviceName"
                  placeholder="My iPhone"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type *</Label>
                <Select name="deviceType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile Phone</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="smartwatch">Smartwatch</SelectItem>
                    <SelectItem value="other">Other Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  name="brand"
                  placeholder="Apple"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="iPhone 14 Pro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lostDate">Lost Date *</Label>
                <Input
                  id="lostDate"
                  name="lostDate"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastLocation">Last Known Location *</Label>
                <Input
                  id="lastLocation"
                  name="lastLocation"
                  placeholder="Central Park, NY"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Device Identifiers</h3>
              <p className="text-sm text-muted-foreground">
                Provide at least one identifier to help identify your device
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="imei">IMEI</Label>
                  <Input
                    id="imei"
                    name="imei"
                    placeholder="123456789012345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    placeholder="ABC123XYZ"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uuid">UUID</Label>
                  <Input
                    id="uuid"
                    name="uuid"
                    placeholder="550e8400-e29b-41d4"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Additional details about your device..."
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload Images</h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="frontImage">Front Image</Label>
                  <div className="relative">
                    <Input
                      id="frontImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFrontImage(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backImage">Back Image</Label>
                  <Input
                    id="backImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBackImage(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceImage">Purchase Invoice</Label>
                  <Input
                    id="invoiceImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setInvoiceImage(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading images...
                  </>
                ) : loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
