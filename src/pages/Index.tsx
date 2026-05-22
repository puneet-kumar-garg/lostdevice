import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, FileText, Users, AlertTriangle } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-6">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Reunite with Your Lost Devices
            </h1>
            <p className="text-xl text-muted-foreground">
              Report lost devices and help others find theirs. A community-driven platform to combat device theft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="text-lg">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg">
                <Link to="/search">
                  <Search className="mr-2 h-5 w-5" />
                  Search Database
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mx-auto mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Quick Device Search</CardTitle>
                <CardDescription className="text-center">
                  Enter IMEI, Serial Number, or UUID to check if a device is reported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQuickSearch} className="flex gap-2">
                  <Input
                    placeholder="Enter device identifier..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How LostDevice Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Report Your Device</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create a detailed report with photos, identifiers, and location information to help recover your lost device.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Search className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Public Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Anyone can search our database using device identifiers to check if a device has been reported as lost or stolen.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Connect & Recover</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  When a match is found, shopkeepers and finders can contact owners through the platform to facilitate recovery.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/20">
            <CardContent className="pt-8 text-center space-y-6">
              <AlertTriangle className="h-16 w-16 text-accent mx-auto" />
              <h2 className="text-3xl font-bold">Lost Your Device?</h2>
              <p className="text-xl text-muted-foreground">
                Don't wait! Report it now and increase your chances of recovery. Our community is here to help.
              </p>
              <Button size="lg" asChild>
                <Link to="/auth">Report Now - It's Free</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
// index page v2
