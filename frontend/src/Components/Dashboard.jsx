import React, { useState, useEffect } from "react";
import Sidebar from "./DashBoard/Sidebar";
import Topbar from "./DashBoard/Topbar";
import ProfileCard from "./DashBoard/ProfileCard";
import PlatformLinks from "./DashBoard/PlatformLinks";
import StreakCard from "./DashBoard/StreakCard";
import GoalsCard from "./DashBoard/GoalsCard";
import TimeSpentCard from "./DashBoard/TimeSpentCard";
import ActivityHeatmap from "./DashBoard/ActivityHeatMap";
import NotesCard from "./DashBoard/NotesCard";
import GithubRepoCard from "./DashBoard/GithubRepoCard";
import { useNavigate } from "react-router-dom";
import { logInfo, logDebug, formatGitHubData } from "../lib/debug";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]); // stateful goals
  const [syncingGithub, setSyncingGithub] = useState(false);
  const navigate= useNavigate();
  
  useEffect(() => {
    // Check if there's a token in the URL params (from GitHub auth)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      console.log("Found token in URL parameters");
      // Store the token temporarily for GitHub API calls
      sessionStorage.setItem("github_token", urlToken);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const fetchProfile = async () => {
      try {
        // First check for token-based auth
        const token = localStorage.getItem("token");
        
        // Create headers based on authentication method
        const headers = {};
        if (token) {
          headers["x-auth-token"] = token;
        }

        // For session auth, we need to include credentials
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: headers,
          credentials: 'include', // Important for session-based auth
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.errors?.[0]?.msg || "Failed to load profile");
        
        // Process GitHub activity data if present
        if (data.activity && Array.isArray(data.activity)) {
          // Format activity data for the heatmap
          data.activity = data.activity.map(activity => {
            const formattedActivity = { ...activity };
            
            // Ensure day property exists
            if (!formattedActivity.day && formattedActivity.date) {
              formattedActivity.day = formattedActivity.date;
            } else if (!formattedActivity.day && formattedActivity.created_at) {
              formattedActivity.day = new Date(formattedActivity.created_at).toISOString().split('T')[0];
            }
            
            // Ensure value property exists
            if (!formattedActivity.value) {
              formattedActivity.value = 1;
            }
            
            return formattedActivity;
          });
          
          // Log activity data
          logInfo("Loaded profile with GitHub activity data", formatGitHubData(data.activity));
        } else {
          logInfo("No GitHub activity data in profile");
          data.activity = [];
        }

        setProfile(data);
        setGoals(data.goals || []);   // ✅ sync backend goals into state
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col h-screen">
      <Topbar />

      <div className="flex flex-1">
        <Sidebar />
<main className="flex-1 p-6 bg-[#d1e4f3]">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">

    {/* Row 1 */}
    <ProfileCard 
      user={profile} 
      className="col-span-1" 
      onSyncGithub={async () => {
        try {
          setSyncingGithub(true);
          console.log("Attempting to sync GitHub data...");
          
          // Try to get GitHub token from session storage (from URL params)
          const githubToken = sessionStorage.getItem("github_token");
          
          const headers = {
            'Accept': 'application/json'
          };
          
          // If we have a GitHub token from the URL, add it to the request
          if (githubToken) {
            headers['Authorization'] = `Bearer ${githubToken}`;
            console.log("Using GitHub token from URL for sync request");
            console.log("Token preview:", `${githubToken.substring(0, 5)}...`);
          }
          
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/github/sync`, {
            credentials: 'include', // Important for session-based auth
            headers: headers
          });
          
          // Parse the response
          const data = await res.json();
          
          if (res.ok) {
            console.log("GitHub sync successful:", data);
            
            // Handle the complete GitHub data package
            if (data.user) {
              console.log("Received GitHub data package:", data.user);
              
              // Extract data components
              const { activity = [], profile = {}, repositories = [], streak = 0 } = data.user;
              
              // Format activity data for the UI (defensive)
              const formattedActivity = Array.isArray(activity) ? activity.map(item => {
                // Make a defensive copy and ensure required fields exist
                const formattedItem = { ...item };
                
                // Ensure day property exists
                if (!formattedItem.day && formattedItem.date) {
                  formattedItem.day = formattedItem.date;
                } else if (!formattedItem.day && formattedItem.created_at) {
                  formattedItem.day = new Date(formattedItem.created_at).toISOString().split('T')[0];
                }
                
                // Ensure value property exists for heatmap
                if (!formattedItem.value) {
                  formattedItem.value = 1;
                }
                
                return formattedItem;
              }) : [];
              
              // Log the formatted data for debugging
              logInfo("GitHub sync successful - formatted activity data:", formatGitHubData(formattedActivity));
              logDebug("GitHub profile data:", profile);
              logDebug("GitHub repositories:", repositories);
              
              // Update the profile state with all GitHub data
              setProfile(prev => {
                // Convert data to the format expected by components
                const formattedData = {
                  ...prev,
                  activity: Array.isArray(formattedActivity) ? formattedActivity.map(a => ({
                    ...a,
                    day: a.day || a.date,
                    value: typeof a.value === 'number' ? a.value : 1
                  })) : [],
                  githubProfile: profile,
                  repositories: repositories,
                  streak: streak
                };
                
                console.log("Setting profile with GitHub data:", formattedData);
                return formattedData;
              });              // Show more detailed data in the console for debugging
              if (formattedActivity.length === 0) {
                logInfo("Warning: No activity data returned from GitHub sync");
                
                // Create sample data for testing UI if no real data is available
                const sampleActivity = [];
                const today = new Date();
                
                for (let i = 0; i < 30; i++) {
                  const date = new Date();
                  date.setDate(today.getDate() - i);
                  const dateStr = date.toISOString().split('T')[0];
                  
                  // Random activity value between 0-5 (with some days having no activity)
                  const value = Math.floor(Math.random() * 6);
                  
                  if (value > 0) {  // Only add days with activity
                    sampleActivity.push({
                      date: dateStr,
                      day: dateStr,
                      value: value,
                      type: "SampleActivity",
                      details: "Sample activity for UI testing"
                    });
                  }
                }
                
                // Update with sample data
                setProfile(prev => ({
                  ...prev,
                  activity: sampleActivity,
                  streak: 3 // Sample streak
                }));
                
                logInfo("Added sample activity data for UI testing", sampleActivity.length);
              }
            } else {
              console.error("No user data in the response");
            }
            
            alert('GitHub data synchronized successfully!');
          } else {
            console.error("GitHub sync failed:", data);
            
            if (res.status === 401) {
              // If unauthorized, try logging in again
              alert("Your GitHub session has expired. Please log out and log in again.");
            } else {
              alert(`Failed to sync GitHub data: ${data.message || 'Please try again.'}`);
            }
          }
        } catch (err) {
          console.error('Error syncing GitHub data:', err);
          alert('Error syncing GitHub data. Please try again.');
        } finally {
          setSyncingGithub(false);
        }
      }}
      syncingGithub={syncingGithub}
    />
    <PlatformLinks platforms={profile?.platforms || []} className="col-span-1" />
    <StreakCard streak={profile?.streak || 0} className="col-span-1" />

    {/* Row 2: Goals, Time Spent, Notes */}
    <GoalsCard goals={goals} onGoalsChange={setGoals} />
    <TimeSpentCard time={profile?.timeSpent || "0 minutes"} />
    {/* Add NotesCard here */}
    <NotesCard notes={profile?.notes || []} onNotesChange={(n) => setProfile({ ...profile, notes: n })} />

    {/* Row 3: GitHub repositories */}
    <div className="col-span-1 sm:col-span-2 lg:col-span-3">
      <ActivityHeatmap activityData={profile?.activity || []} />
    </div>
    
    {/* Row 4: GitHub repositories - only show if we have repository data */}
    {profile?.repositories && profile.repositories.length > 0 && (
      <div className="col-span-1 sm:col-span-2 lg:col-span-3">
        <GithubRepoCard repositories={profile.repositories || []} />
      </div>
    )}
  </div>
</main>
      </div>
    </div>
  );
}
