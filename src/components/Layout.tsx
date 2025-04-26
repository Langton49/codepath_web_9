import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import {
  Home,
  PlusCircle,
  Sun,
  Moon,
  MonitorSmartphone,
  Leaf,
  LogIn,
  UserPlus,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, toggleColorMode } = useAppContext();
  const location = useLocation();

  const isAuthenticated = Boolean(user); // Check if user exists
  const isAnonymous = user && !user.email; // Anonymous users don't have email addresses

  const colorSchemeIcon = () => {
    switch (user?.preferences?.colorScheme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      case "system":
        return <MonitorSmartphone className="h-5 w-5" />;
    }
  };

  const colorSchemeName = () => {
    switch (user?.preferences?.colorScheme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-6 w-6" />
            <span className="font-bold text-xl">Artemis</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Button variant="default" asChild>
              <Link
                to="/"
                className={location.pathname === "/" ? "bg-transparent" : ""}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>

            {isAuthenticated ? (
              <>
                <Button asChild>
                  <Link to="/create">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Post
                  </Link>
                </Button>

                {isAnonymous && (
                  <Button variant="default" asChild>
                    <Link to="/auth">
                      <UserPlus className="" />
                      Create Account
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container my-6">{children}</main>

      <footer className="bg-muted py-6">
        <div className="container text-center">
          <p className="text-muted-foreground text-sm mt-2">
            Artemis Eco Forum • © {new Date().getFullYear()} • Connecting
            environmentalists worldwide
          </p>
        </div>
      </footer>
    </div>
  );
}
