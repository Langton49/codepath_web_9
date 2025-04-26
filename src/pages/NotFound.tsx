
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Leaf } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <Leaf className="h-16 w-16 text-artemis-primary mx-auto animate-pulse-gentle" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-6 max-w-md">
          The path you're looking for doesn't exist in our forest. Let's guide you back to the main trail.
        </p>
        <Button asChild size="lg">
          <Link to="/">
            Return to Home
          </Link>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
