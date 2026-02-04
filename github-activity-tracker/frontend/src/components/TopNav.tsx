import React from "react";
import { LayoutGrid, Trophy, Download } from "lucide-react";

interface TopNavProps {
  activePage: "dashboard" | "leaderboard";
  onChange: (page: "dashboard" | "leaderboard") => void;

  title: string;

  period: "daily" | "weekly" | "monthly";
  onPeriodChange: (p: "daily" | "weekly" | "monthly") => void;

  team: string;
  onTeamChange: (value: string) => void;

  project: string;
  onProjectChange: (value: string) => void;

  onDownloadCSV: () => void;
  onDownloadJSON: () => void;
}

const TopNav: React.FC<TopNavProps> = ({
  activePage,
  onChange,
  title,
  period,
  onPeriodChange,
  team,
  onTeamChange,
  project,
  onProjectChange,
  onDownloadCSV,
  onDownloadJSON,
}) => {
  const tabStyle = (active: boolean) =>
    `px-4 py-2 rounded-lg font-medium transition-all ${
      active ? "bg-blue-600 text-white" : "text-gray-600 hover:text-black"
    }`;

  const periodBtn = (active: boolean) =>
    `px-4 py-2 rounded-lg font-medium transition-all ${
      active
        ? "bg-blue-600 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="w-full bg-white border-b shadow-sm pb-6">

      
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        <button
          onClick={() => onChange("dashboard")}
          className={tabStyle(activePage === "dashboard")}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} />
            Dashboard
          </div>
        </button>

        <button
          onClick={() => onChange("leaderboard")}
          className={tabStyle(activePage === "leaderboard")}
        >
          <div className="flex items-center gap-2">
            <Trophy size={18} />
            Leaderboard
          </div>
        </button>
      </div>

      
      <div className="border-b"></div>

      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {activePage === "dashboard" ? "GitHub Activity Tracker" : "Leaderboard"}
        </h1>
      </div>

      
      <div className="max-w-7xl mx-auto px-6 mt-4 flex flex-wrap items-start gap-10">

        
        <div className="flex flex-col">
          <label className="text-gray-600 text-sm font-medium mb-2">Period</label>
          <div className="flex items-center gap-2">
            <button className={periodBtn(period === "daily")} onClick={() => onPeriodChange("daily")}>Daily</button>
            <button className={periodBtn(period === "weekly")} onClick={() => onPeriodChange("weekly")}>Weekly</button>
            <button className={periodBtn(period === "monthly")} onClick={() => onPeriodChange("monthly")}>Monthly</button>
          </div>
        </div>

        
        <div className="flex flex-col">
          <label className="text-gray-600 text-sm font-medium mb-2">Team</label>
          <select
            value={team}
            onChange={(e) => onTeamChange(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="all">All Teams</option>
            <option value="frontend">Frontend Team</option>
            <option value="backend">Backend Team</option>
            <option value="devops">DevOps Team</option>
          </select>
        </div>

        
        <div className="flex flex-col">
          <label className="text-gray-600 text-sm font-medium mb-2">Project</label>
          <select
            value={project}
            onChange={(e) => onProjectChange(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="all">All Projects</option>
            <option value="alpha">Project Alpha</option>
            <option value="beta">Project Beta</option>
            <option value="gamma">Project Gamma</option>
          </select>
        </div>

        
        <div className="flex flex-col">
          <label className="text-gray-600 text-sm font-medium mb-2">&nbsp;</label>
          <button
            onClick={onDownloadCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            <Download size={18} /> CSV
          </button>
        </div>

        
        <div className="flex flex-col">
          <label className="text-gray-600 text-sm font-medium mb-2">&nbsp;</label>
          <button
            onClick={onDownloadJSON}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Download size={18} /> JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
