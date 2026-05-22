import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, AlertTriangle, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const searchSchema = z.object({
  imei: z.string().trim().max(20, "IMEI must be less than 20 characters").regex(/^\d*$/, "IMEI must contain only digits").optional().or(z.literal('')),
  serialNumber: z.string().trim().max(50, "Serial number must be less than 50 characters").optional().or(z.literal('')),
  uuid: z.string().trim().max(100, "UUID must be less than 100 characters").optional().or(z.literal('')),
  brand: z.string().trim().max(50, "Brand must be less than 50 characters").optional().or(z.literal('')),
  model: z.string().trim().max(100, "Model must be less than 100 characters").optional().or(z.literal('')),
}).refine(
  (data) => data.imei || data.serialNumber || data.uuid || data.brand || data.model,
  { message: "At least one search field is required" }
);

interface SearchResult {
  id: string;
  device_name: string;
  device_type: string;
  brand: string;
  model: string;
  status: string;
  lost_date: string;
  last_location: string;
  front_image_url: string | null;
}

// search page v3
export default function Search() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const searchData = {
        imei: (formData.get("imei") as string || '').trim(),
        serialNumber: (formData.get("serialNumber") as string || '').trim(),
        uuid: (formData.get("uuid") as string || '').trim(),
        brand: (formData.get("brand") as string || '').trim(),
        model: (formData.get("model") as string || '').trim(),
      };

      // Validate input
      const validated = searchSchema.parse(searchData);

      setLoading(true);
      setSearched(true);

      // Call the secure edge function
      const { data: responseData, error } = await supabase.functions.invoke('search-devices', {
        body: {
          imei: validated.imei || undefined,
          serialNumber: validated.serialNumber || undefined,
          uuid: validated.uuid || undefined,
          brand: validated.brand || undefined,
          model: validated.model || undefined,
        }
      });

      if (error) throw error;

      const results = responseData?.results || [];
      setResults(results);

      if (results.length > 0) {
        toast({
          variant: "destructive",
          title: "⚠️ Potential Match Found!",
          description: `Found ${results.length} device(s) matching your search. This device may be reported as lost!`,
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid search",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Search failed",
          description: error.message || "Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Search Lost Devices</h1>
          <p className="text-muted-foreground">
            Check if a device has been reported as lost or stolen
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
            <CardDescription>
              Enter device identifiers or brand/model information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Search by Identifier (Choose one)
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="imei">IMEI</Label>
                    <Input
                      id="imei"
                      name="imei"
                      placeholder="123456789012345"
                      maxLength={20}
                      pattern="\d*"
                      title="IMEI must contain only digits"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      placeholder="ABC123XYZ"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uuid">UUID</Label>
                    <Input
                      id="uuid"
                      name="uuid"
                      placeholder="550e8400-e29b-41d4"
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Search by Brand/Model
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      name="brand"
                      placeholder="Apple, Samsung, etc."
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="iPhone 14, Galaxy S23, etc."
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <SearchIcon className="mr-2 h-4 w-4" />
                {loading ? "Searching..." : "Search Database"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Search Results {results.length > 0 && `(${results.length})`}
            </h2>

            {results.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    No matching devices found in the database. This device has not been reported as lost.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-destructive bg-destructive/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-destructive mb-1">
                          Warning: Device May Be Stolen
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          The device you searched for matches one or more lost device reports. 
                          If you have this device, please contact the owner or local authorities.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  {results.map((device) => (
                    <Card
                      key={device.id}
                      className="cursor-pointer transition-shadow hover:shadow-lg border-destructive/50"
                      onClick={() => navigate(`/device/${device.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{device.device_name}</CardTitle>
                          <Badge variant="destructive">{device.status}</Badge>
                        </div>
                        <CardDescription>
                          {device.brand} {device.model}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {device.front_image_url && (
                          <img
                            src={device.front_image_url}
                            alt={device.device_name}
                            className="w-full h-48 object-cover rounded-md mb-4"
                          />
                        )}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Lost: {new Date(device.lost_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{device.last_location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
