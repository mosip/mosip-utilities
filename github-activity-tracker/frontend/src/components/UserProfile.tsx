import React, { useState } from "react";
import {
  ArrowLeft,
  Download,
  GitCommit,
  GitPullRequest,
  MessageSquare,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import ActivityChart from "./ActivityChart";
import ActivityTrend from "./ActivityTrend";

interface UserProfileProps {
  userName: string;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userName, onBack }) => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  const profile = {
    name: userName,
    email: `${userName.toLowerCase().replace(" ", ".")}@company.com`,
    team: "Frontend Team",
    project: "Project Alpha",
  };

  const commits = 42;
  const prs = 16;
  const reviews = 50;

  const dummyActivities = [
    { type: "commit", date: "Sun", count: 5 },
    { type: "pull_request", date: "Sun", count: 0 },
    { type: "review", date: "Sun", count: 2 },
    { type: "commit", date: "Mon", count: 4 },
    { type: "pull_request", date: "Mon", count: 1 },
    { type: "review", date: "Mon", count: 1 },
    { type: "commit", date: "Tue", count: 13 },
    { type: "pull_request", date: "Tue", count: 6 },
    { type: "review", date: "Tue", count: 4 },
    { type: "commit", date: "Wed", count: 12 },
    { type: "pull_request", date: "Wed", count: 5 },
    { type: "review", date: "Wed", count: 3 },
    { type: "commit", date: "Thu", count: 4 },
    { type: "pull_request", date: "Thu", count: 8 },
    { type: "review", date: "Thu", count: 14 },
    { type: "commit", date: "Fri", count: 8 },
    { type: "pull_request", date: "Fri", count: 3 },
    { type: "review", date: "Fri", count: 4 },
    { type: "commit", date: "Sat", count: 1 },
    { type: "pull_request", date: "Sat", count: 1 },
    { type: "review", date: "Sat", count: 2 },
  ];

  const detailed = [
    { date: "Feb 3", commits: 5, prs: 0, reviews: 14 },
    { date: "Feb 2", commits: 0, prs: 3, reviews: 6 },
    { date: "Feb 1", commits: 7, prs: 2, reviews: 3 },
    { date: "Jan 31", commits: 1, prs: 1, reviews: 3 },
    { date: "Jan 30", commits: 9, prs: 4, reviews: 0 },
    { date: "Jan 29", commits: 6, prs: 0, reviews: 15 },
    { date: "Jan 28", commits: 14, prs: 6, reviews: 9 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      
      <div className="w-full bg-white border-b shadow-sm px-8 py-6">

        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-4xl text-blue-600">
              👤
            </div>

            <div>
              <h1 className="text-4xl font-bold">{profile.name}</h1>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-gray-500">
                {profile.team} • {profile.project}
              </p>
            </div>
          </div>

          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg">
              <Download size={18} /> CSV
            </button>

            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg">
              <Download size={18} /> JSON
            </button>
          </div>
        </div>

        
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-5 py-2 rounded-lg ${
              period === "daily"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Daily
          </button>

          <button
            onClick={() => setPeriod("weekly")}
            className={`px-5 py-2 rounded-lg ${
              period === "weekly"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Weekly
          </button>

          <button
            onClick={() => setPeriod("monthly")}
            className={`px-5 py-2 rounded-lg ${
              period === "monthly"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      

      <div className="max-w-7xl mx-auto px-6">

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
          <StatsCard title="Commits" value={commits} icon={GitCommit} />
          <StatsCard title="Pull Requests" value={prs} icon={GitPullRequest} />
          <StatsCard title="Code Reviews" value={reviews} icon={MessageSquare} />
        </div>

       
        <div className="bg-white border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Activity Overview – Weekly</h2>
          <ActivityChart activities={dummyActivities as any} period="weekly" />
        </div>

        
        <ActivityTrend
          data={[
            { date: "Feb 4", commits: 28, prs: 5, reviews: 13 },
            { date: "Feb 3", commits: 7, prs: 4, reviews: 14 },
            { date: "Feb 2", commits: 16, prs: 1, reviews: 10 },
            { date: "Feb 1", commits: 7, prs: 0, reviews: 4 },
            { date: "Jan 31", commits: 0, prs: 0, reviews: 1 },
            { date: "Jan 30", commits: 20, prs: 3, reviews: 12 },
            { date: "Jan 29", commits: 9, prs: 1, reviews: 1 },
          ]}
        />

        
        <div className="bg-white border rounded-xl p-6 shadow-sm mb-10">
          <h2 className="text-xl font-semibold mb-4">Detailed Activity</h2>

          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="pb-3">Date</th>
                <th className="pb-3">Commits</th>
                <th className="pb-3">Pull Requests</th>
                <th className="pb-3">Reviews</th>
                <th className="pb-3">Total</th>
              </tr>
            </thead>

            <tbody>
              {detailed.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-3">{row.date}</td>

                  <td className="text-blue-600 font-medium">{row.commits}</td>

                  <td className="text-green-600 font-medium">{row.prs}</td>

                  <td className="text-red-600 font-medium">{row.reviews}</td>

                  <td className="font-semibold">
                    {row.commits + row.prs + row.reviews}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default UserProfile;
