import React, { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/Components/ui/Card";

export default function TimeSpentCard() {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef(null);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL;

  const formatTime = (minutes) => {
    if (minutes === 0) return "-- : --";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile/time`, {
          headers: { "x-auth-token": token }
        });
        const data = await res.json();
        if (data.timeSpent) {
          const match = data.timeSpent.match(/(\d+)h\s*(\d+)?m?/);
          const mins =
            match && match.length >= 2
              ? parseInt(match[1]) * 60 + (parseInt(match[2]) || 0)
              : 0;
          setTimeSpent(mins);
        }
      } catch (err) {
        console.error("Failed to fetch time:", err);
      }
    };
    fetchTime();
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 60000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  useEffect(() => {
    const handleVisibilityChange = () => setIsActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const saveTime = async () => {
      try {
        const formatted = formatTime(timeSpent);
        await fetch(`${API_URL}/api/user/time`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ timeSpent: formatted }),
        });
      } catch (err) {
        console.error("Error saving time:", err);
      }
    };

    const saveInterval = setInterval(saveTime, 5 * 60 * 1000);
    window.addEventListener("beforeunload", saveTime);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", saveTime);
    };
  }, [timeSpent]);

  return (
    <Card className="flex flex-col items-center justify-center p-5 sm:p-6 w-full sm:w-auto hover:shadow-lg transition-shadow duration-300 cursor-pointer select-none">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-center gap-2 mb-3 w-full">
        <Clock
          size={26}
          className="text-[var(--accent)] block " // ensure visible
          strokeWidth={2.2}
        />
        <p className="text-base sm:text-lg font-semibold text-[var(--primary)]">
          Time Spent
        </p>
      </CardHeader>

      {/* Circle */}
      <CardContent className="flex flex-col items-center justify-center">
        <div className="w-28 h-28 rounded-full border-[5px] border-[var(--accent)] flex items-center justify-center bg-[var(--card)] shadow-inner">
          <span className="text-2xl font-semibold text-[var(--primary)]">
            {formatTime(timeSpent)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
