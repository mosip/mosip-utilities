import { useState, useEffect } from "react";

import { StatsCard } from "./components/StatsCard";
import ActivityChart from "./components/ActivityChart";
import DetailView from "./components/DetailView";
import TopNav from "./components/TopNav";
import TeamMembers from "./components/TeamMembers";
import LeaderboardCard from "./components/LeaderboardCard";
import UserProfile from "./components/UserProfile";   

import { useGitHubActivity } from "./lib/hooks";
import { fetchUsers } from "./lib/api";

import type { ActivityItem } from "./lib/database.types";

import { GitCommit, GitPullRequest, MessageSquare } from "lucide-react";

const userTeamMap: Record<string, string> = {
  "Alice Johnson": "Frontend",
  "Bob Smith": "Backend",
  "Carol Williams": "Frontend",
  "David Brown": "Backend",
  "Emma Davis": "DevOps",
  "Frank Miller": "Frontend",
  "Grace Lee": "Backend",
  "Henry Wilson": "DevOps",
};

const userProjectMap: Record<string, string> = {
  "Alice Johnson": "Alpha",
  "Bob Smith": "Alpha",
  "Carol Williams": "Beta",
  "David Brown": "Beta",
  "Emma Davis": "Alpha",
  "Frank Miller": "Gamma",
  "Grace Lee": "Gamma",
  "Henry Wilson": "Beta",
};

function App() {
  const [activePage, setActivePage] = useState<
    "dashboard" | "leaderboard" | "profile"
  >("dashboard");

  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [selectedRepo] = useState<string>("all");
  const [startDate] = useState<string>("");
  const [endDate] = useState<string>("");
  const [dateRange] = useState<string>("all");
  const [shouldFetchData] = useState<boolean>(false);

  const [users, setUsers] = useState<string[]>([]);
  const [selectedRepos] = useState<string[]>([]);
  const [selectedUsers] = useState<string[]>([]);
  const [currentUsername] = useState<string>("");

  const [displayedActivities, setDisplayedActivities] =
    useState<ActivityItem[]>([]);

  const [filterType, setFilterType] = useState<
    "all" | "commit" | "pull_request" | "review"
  >("all");

  const [showDetailView, setShowDetailView] = useState(false);
  const [detailViewType, setDetailViewType] = useState<
    "commit" | "pull_request" | "review" | null
  >(null);
  const [detailViewData, setDetailViewData] =
    useState<ActivityItem[] | null>(null);

  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );
  const [team, setTeam] = useState("all");
  const [project, setProject] = useState("all");

  const { activities, loading, error } = useGitHubActivity(
    selectedRepo,
    dateRange,
    startDate,
    endDate,
    shouldFetchData,
    currentUsername,
    selectedRepos,
    selectedUsers
  );

  useEffect(() => {
    async function loadUsers() {
      try {
        const list = await fetchUsers();
        setUsers(list);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    const enriched = activities.map((a) => ({
      ...a,
      team: userTeamMap[a.author] || "Unknown",
      project: userProjectMap[a.author] || "Unknown",
    }));

    setDisplayedActivities(enriched);
  }, [activities]);

  const openPRCount = displayedActivities.filter(
    (a) => a.type === "pull_request" && a.state === "OPEN"
  ).length;

  const closedPRCount = displayedActivities.filter(
    (a) => a.type === "pull_request" && a.state === "CLOSED"
  ).length;

  const reviewCount = displayedActivities.filter(
    (a) => a.type === "review"
  ).length;

  const handleSelectUser = (name: string) => {
    setSelectedUser(name);
    setActivePage("profile");
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setDetailViewType(null);
    setDetailViewData(null);
  };

  const filteredActivities = displayedActivities.filter((a) => {
    const teamMatch =
      team === "all" || a.team?.toLowerCase() === team.toLowerCase();

    const projectMatch =
      project === "all" || a.project?.toLowerCase() === project.toLowerCase();

    return teamMatch && projectMatch;
  });

  return (
    <div className="min-h-screen bg-gray-100">

      {activePage !== "profile" && (
        <TopNav
          activePage={activePage}
          onChange={setActivePage}
          title="GitHub Activity Tracker"
          period={period}
          onPeriodChange={setPeriod}
          team={team}
          onTeamChange={setTeam}
          project={project}
          onProjectChange={setProject}
          onDownloadCSV={() => console.log("CSV")}
          onDownloadJSON={() => console.log("JSON")}
        />
      )}

      {activePage === "profile" && selectedUser && (
        <UserProfile
          userName={selectedUser}
          onBack={() => setActivePage("dashboard")}
        />
      )}

      
      {activePage === "dashboard" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Commits"
                  value={
                    filteredActivities.filter((a) => a.type === "commit").length
                  }
                  icon={GitCommit}
                />

                <StatsCard
                  title="Open Pull Requests"
                  value={openPRCount}
                  icon={GitPullRequest}
                />

                <StatsCard
                  title="Closed Pull Requests"
                  value={closedPRCount}
                  icon={GitPullRequest}
                />

                <StatsCard
                  title="Reviews"
                  value={reviewCount}
                  icon={MessageSquare}
                />
              </div>

              <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
                <ActivityChart
                  activities={filteredActivities}
                  period={period}
                />
              </div>

              <TeamMembers
                team={team}
                project={project}
                onSelectUser={handleSelectUser}
              />

              {showDetailView && (
                <DetailView
                  type={detailViewType}
                  data={detailViewData}
                  onClose={handleCloseDetailView}
                />
              )}
            </>
          )}
        </main>
      )}

      
      {activePage === "leaderboard" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>

          <LeaderboardCard />
        </main>
      )}
    </div>
  );
}

export default App;
