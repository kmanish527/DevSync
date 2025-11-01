import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { Card, CardHeader } from "@/Components/ui/Card";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function StreakCard({ streak = 0, activity = [] ,startDate=" "}) {
  const isActive = streak > 0;
  const [showPopup, setShowPopup] = useState(false);
  const [longestStreak, setLongestStreak] = useState(0);
  const [longestRange, setLongestRange] = useState({ start: null, end: null });
  const [currentRange, setCurrentRange] = useState({ start: null, end: null });
  const [period, setPeriod] = useState("");

  // ✅ Format helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ✅ Compute current & longest streak safely
  useEffect(() => {
    if (!Array.isArray(activity) || activity.length === 0) return;

    const validActivityDates = activity
      .map((d) => {
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date;
      })
      .filter(Boolean)
      .sort((a, b) => a - b)
      .map((d) => d.toISOString().split("T")[0]);

    if (validActivityDates.length === 0) return;

    let longest = 1,
      current = 1,
      tempStart = validActivityDates[0],
      tempEnd = validActivityDates[0],
      bestStart = validActivityDates[0],
      bestEnd = validActivityDates[0];

    for (let i = 1; i < validActivityDates.length; i++) {
      const prev = new Date(validActivityDates[i - 1]);
      const curr = new Date(validActivityDates[i]);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        current++;
        tempEnd = validActivityDates[i];
      } else {
        if (current > longest) {
          longest = current;
          bestStart = tempStart;
          bestEnd = tempEnd;
        }
        current = 1;
        tempStart = validActivityDates[i];
        tempEnd = validActivityDates[i];
      }
    }

    if (current > longest) {
      longest = current;
      bestStart = tempStart;
      bestEnd = tempEnd;
    }

    setLongestStreak(longest);
    setLongestRange({ start: bestStart, end: bestEnd });

    // Current streak range
    const today = new Date().toISOString().split("T")[0];
    const lastActivity = validActivityDates[validActivityDates.length - 1];
    if (new Date(today) - new Date(lastActivity) <= 24 * 60 * 60 * 1000) {
      let i = validActivityDates.length - 1;
      while (i > 0) {
        const prev = new Date(validActivityDates[i - 1]);
        const curr = new Date(validActivityDates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) i--;
        else break;
      }
      setCurrentRange({ start: validActivityDates[i], end: lastActivity });
    }
  }, [activity]);

  // ✅ Period display
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date();
    const options = { month: "short", day: "numeric" };
    setPeriod(`${start.toLocaleDateString("en-US", options)} – ${end.toLocaleDateString("en-US", options)}`);
  }, [startDate]);

  // ✅ Longest streak in localStorage
  useEffect(() => {
    const savedLongest = parseInt(localStorage.getItem("longestStreak") || "0", 10);
    if (streak > savedLongest) {
      localStorage.setItem("longestStreak", streak);
      setLongestStreak(streak);
    } else {
      setLongestStreak(savedLongest);
    }
  }, [streak]);

  // ✅ Popup logic
  useEffect(() => {
    if (!isActive) return;

    const today = new Date().toISOString().split("T")[0];
    const lastShownDate = localStorage.getItem("streakPopupShown");

    if (lastShownDate !== today) {
      setShowPopup(true);
      localStorage.setItem("streakPopupShown", today);
    }
  }, [isActive]);

  useEffect(() => {
    const handleClick = () => setShowPopup(false);
    if (showPopup) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showPopup]);

  return (
    <>
      {/* DevSync Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative max-w-sm w-full rounded-3xl px-8 py-10 border border-[var(--border)] shadow-lg text-center bg-[var(--background)] overflow-hidden"
            >
              <motion.h3
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-2xl font-bold text-[var(--foreground)] mb-6"
              >
                Another streak day locked in!
              </motion.h3>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className="relative flex items-center justify-center mb-6"
              >
                <DotLottieReact
                  src="/animations/Celebration.lottie"
                  autoplay
                  loop={false}
                  className="absolute w-60 h-60"
                />
                <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center bg-transparent border-2 border-orange-500 shadow-[0_0_25px_rgba(255,140,0,0.5)]">
                  <Flame size={60} className="text-orange-500 fill-orange-500" />
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="mt-2 text-base text-[var(--muted-foreground)] font-medium"
              >
                You’re keeping your{" "}
                <span className="text-orange-500 font-semibold">DevSync</span> streak alive ✨
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Streak Card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ translateY: -4 }}
        className="w-full flex justify-center"
      >
        <Card className="flex flex-col items-center justify-center p-4 sm:p-6 w-full sm:w-auto hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-col items-center gap-3">
            <motion.div className="relative w-52 h-48 flex flex-col items-center justify-center">
              <div className="flex items-end justify-center w-full h-36">
                {(() => {
                  const heights = [18, 26, 34, 42, 34, 26, 18];
                  const totalBars = heights.length;
                  return heights.map((h, i) => {
                    const isActive = i < Math.min(streak, totalBars);
                    return (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0.2, opacity: 0.3 }}
                        animate={{
                          scaleY: 1,
                          opacity: isActive ? 1 : 0.4,
                          background: isActive ? "#f97316" : "var(--muted-foreground)",
                          boxShadow: isActive ? "0 0 10px rgba(251,146,60,0.7)" : "none",
                        }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="w-6 mx-[10px] rounded-md origin-bottom"
                        style={{ height: `${h * 1.5}px` }}
                      />
                    );
                  });
                })()}
              </div>

              <span className="mt-4 text-orange-500 text-3xl font-semibold tracking-tight">
                {streak}
              </span>
            </motion.div>
          </CardHeader>

          {/* 🧭 Summary section */}
          <div className="w-full flex justify-between items-center mt-4 border-t pt-3 text-sm relative">
            <div className="flex flex-col items-start">
              <span className="text-[var(--foreground)] font-semibold text-xs ">
                Current Streak: {streak}
              </span>
              <span className="text-[var(--muted-foreground)] text-xs">
                {currentRange.start && `${formatDate(currentRange.start)} - ${formatDate(currentRange.end)}`}
              </span>
            </div>

            <div className="h-8 w-[1.5px] bg-gradient-to-b from-orange-500/60 to-yellow-400/60 mx-4 rounded-full" />

            <div className="flex flex-col items-end">
              <span className="text-orange-500 font-semibold text-xs">
                Longest Streak: {longestStreak}
              </span>
              <span className="text-[var(--muted-foreground)] text-xs">
                {longestRange.start && `${formatDate(longestRange.start)} - ${formatDate(longestRange.end)}`}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
