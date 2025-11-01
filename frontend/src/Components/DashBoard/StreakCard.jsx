import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/Components/ui/Card";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function StreakCard({ streak = 0, startDate = "2025-10-25" }) {
  const isActive = streak > 0;
  const [showPopup, setShowPopup] = useState(false);
  const [longestStreak, setLongestStreak] = useState(0);
  const [period, setPeriod] = useState("");

  const currentStartDate = "Oct 25";
const currentEndDate = "Oct 27";
const longestStartDate = "Sep 10";
const longestEndDate = "Sep 18";

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date();
    const options = { month: "short", day: "numeric" };
    setPeriod(`${start.toLocaleDateString("en-US", options)} – ${end.toLocaleDateString("en-US", options)}`);
  }, [startDate]);

  useEffect(() => {
    const savedLongest = parseInt(localStorage.getItem("longestStreak") || "0", 10);
    if (streak > savedLongest) {
      localStorage.setItem("longestStreak", streak);
      setLongestStreak(streak);
    } else {
      setLongestStreak(savedLongest);
    }
  }, [streak]);

  useEffect(() => {
    if (!isActive) return;

    const today = new Date().toISOString().split("T")[0];
    const lastShownDate = localStorage.getItem("streakPopupShown");

    if (lastShownDate !== today) {
      setShowPopup(true);
      localStorage.setItem("streakPopupShown", today);
    }
  }, [isActive]);

  // Close popup when user clicks anywhere
  useEffect(() => {
    const handleClick = () => setShowPopup(false);
    if (showPopup) {
      document.addEventListener("click", handleClick);
    }
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
        {/* ✨ Top text */}
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl font-bold text-[var(--foreground)] mb-6"
        >
          Another streak day locked in!
        </motion.h3>

        {/* Flame + Animation (center) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="relative flex items-center justify-center mb-6"
        >
          {/* Background animation */}
          <DotLottieReact
            src="/animations/Celebration.lottie"
            autoplay
            loop={false}  //  plays only once
            className="absolute w-60 h-60"
          />

          {/* Flame icon in front */}
          <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center bg-transparent border-2 border-orange-500 shadow-[0_0_25px_rgba(255,140,0,0.5)]">
            <Flame size={60} className="text-orange-500 fill-orange-500" />
          </div>
        </motion.div>

        {/*  Bottom text */}
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
      <motion.div
  className="relative w-52 h-48 flex flex-col items-center justify-center"
>
  <div className="flex items-end justify-center w-full h-36">
    {(() => {
      // Heights in a diamond shape
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
              background: isActive
                ? "#f97316" // 
                : "var(--muted-foreground)",
              boxShadow: isActive
                ? "0 0 10px rgba(251,146,60,0.7)"
                : "none",
            }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="w-6 mx-[8px] rounded-md origin-bottom"
            style={{ height: `${h * 1.5}px` }}
          />
        );
      });
    })()}
  </div>

  {/* 🔢 Streak number below the diamond */}
  <span className="mt-4 text-orange-500 text-3xl font-semibold tracking-tight">
    {streak}
  </span>
</motion.div>


    </CardHeader>

    {/* 🧭 New summary section */}
    <div className="w-full flex justify-between items-center mt-4 border-t pt-3 text-sm">
      {/* Left: current streak */}
      <div className="flex flex-col items-start">
        <span className="text-[var(--foreground)] font-semibold">
          Current Streak: {streak}
        </span>
        <span className="text-[var(--muted-foreground)] text-xs">
          {currentStartDate} - {currentEndDate}
        </span>
      </div>

      {/* Right: longest streak */}
      <div className="flex flex-col items-end">
        <span className="text-orange-500 font-semibold">
          Longest Streak: {longestStreak}
        </span>
        <span className="text-[var(--muted-foreground)] text-xs">
          {longestStartDate} - {longestEndDate}
        </span>
      </div>
    </div>
  </Card>
</motion.div>

    </>
  );
}
