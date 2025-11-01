import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/Components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";

export default function TotalProblemsCard({ profileData }) {
  const [platform, setPlatform] = useState("leetcode");
  const [totalSolved, setTotalSolved] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Extract username from profile link
  const getUsernameFromUrl = (url) => {
    if (!url) return null;
    const parts = url.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1];
  };

  const username = getUsernameFromUrl(profileData?.socialLinks?.[platform]);

  const fetchProblems = async () => {
    if (!username) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/${platform}/${username}`
      );

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const total =
        data?.data?.submitStatsGlobal?.find((s) => s.difficulty === "All")
          ?.count || 0;
      setTotalSolved(total);
    } catch (err) {
      console.error(err);
      setTotalSolved(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (username) fetchProblems();
  }, [platform]);

  return (
    <Card
      className="p-5 sm:p-6 w-full sm:w-auto hover:shadow-lg transition-shadow duration-200 cursor-pointer select-none"
    >
      <CardHeader
        className="cursor-pointer"
      >
        <h3 className="font-semibold text-[var(--primary)] cursor-pointer">
          Total Problems Solved
        </h3>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 cursor-pointer">
        <div className="flex flex-col sm:flex-row gap-2 items-center w-full cursor-pointer">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-full sm:w-[200px] cursor-pointer">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent className="cursor-pointer">
              <SelectItem value="leetcode">LeetCode</SelectItem>
              <SelectItem value="codeforces">Codeforces</SelectItem>
              <SelectItem value="codechef">CodeChef</SelectItem>
              <SelectItem value="hackerrank">HackerRank</SelectItem>
              <SelectItem value="hackerearth">HackerEarth</SelectItem>
              <SelectItem value="gfg">GeeksforGeeks</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 sm:w-auto w-full cursor-pointer"
            onClick={fetchProblems}
            disabled={isLoading || !username}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isLoading ? "Syncing..." : "Sync"}
          </Button>
        </div>

        {username ? (
          <div className="text-center mt-2 cursor-pointer">
            {totalSolved !== null ? (
              <>
                <p className="text-sm text-[var(--muted-foreground)] mb-1">
                  Synced from{" "}
                  <span className="font-medium capitalize">{platform}</span>
                </p>
                <h1 className="text-3xl font-bold text-[var(--primary)]">
                  {totalSolved}
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  problems solved
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] italic">
                {isLoading
                  ? "Fetching data..."
                  : "Click sync to fetch problem stats"}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[var(--muted-foreground)] text-sm italic text-center cursor-pointer">
            No {platform} username linked in your profile.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
