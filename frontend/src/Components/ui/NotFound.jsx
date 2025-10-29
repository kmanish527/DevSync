import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react'; 
import { Button } from "@/Components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const handleRedirect = () => {
    if (isAuthenticated) {
      navigate("/dashboard"); 
    } else {
      navigate("/"); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4 text-center">
      <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
        • DevSync Error •
      </p>

      <h1 className="text-8xl md:text-9xl font-extrabold text-[var(--primary)] mb-4 animate-pulse-slow">
        404
      </h1>

      <h2 className="text-3xl md:text-5xl font-bold mb-6 text-red-500 leading-tight">
        Oops! Page Not Found
      </h2>

      <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-lg mb-8">
        It looks like the page you're trying to reach doesn't exist or has been moved.
        Don't worry, we'll help you get back on track.
      </p>

      <Button 
        onClick={handleRedirect} 
        className="inline-flex items-center justify-center gap-2 px-6 py-3 h-auto
                   bg-[var(--primary)] text-white font-semibold rounded-md 
                   shadow-lg hover:bg-[var(--accent)] transition-colors duration-300
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-75"
      >
        <Home className="h-5 w-5" />
        {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
      </Button>
    </div>
  );
}
