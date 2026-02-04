import React from "react";
import { Trophy, Medal, Award } from "lucide-react";

interface Leader {
  name: string;
  team: string;
  project: string;
  commits: number;
  prs: number;
  reviews: number;
  total: number;
}

const dummyLeaderboard: Leader[] = [
  {
    name: "Alice Johnson",
    team: "Frontend Team",
    project: "Project Alpha",
    commits: 308,
    prs: 101,
    reviews: 197,
    total: 606,
  },
  {
    name: "Bob Smith",
    team: "Backend Team",
    project: "Project Alpha",
    commits: 260,
    prs: 85,
    reviews: 140,
    total: 485,
  },
  {
    name: "Grace Lee",
    team: "Backend Team",
    project: "Project Gamma",
    commits: 203,
    prs: 72,
    reviews: 128,
    total: 403,
  },
  {
    name: "Emma Davis",
    team: "DevOps Team",
    project: "Project Alpha",
    commits: 191,
    prs: 62,
    reviews: 126,
    total: 379,
  },
  {
    name: "Frank Miller",
    team: "Frontend Team",
    project: "Project Gamma",
    commits: 200,
    prs: 58,
    reviews: 81,
    total: 339,
  },
];

const LeaderboardCard: React.FC = () => {
  return (
    <div className="space-y-6">
      {dummyLeaderboard.map((user, idx) => {
        const rank = idx + 1;

        let badge = null;
        let wrapperClass = "border border-gray-300 bg-white";

        if (rank === 1) {
          badge = <Trophy className="text-yellow-500 w-6 h-6" />;
          wrapperClass = "border-2 border-yellow-400 bg-yellow-50";
        } else if (rank === 2) {
          badge = <Medal className="text-gray-400 w-6 h-6" />;
          wrapperClass = "border-2 border-gray-300 bg-white";
        } else if (rank === 3) {
          badge = <Award className="text-orange-500 w-6 h-6" />;
          wrapperClass = "border-2 border-orange-400 bg-orange-50";
        }

        return (
          <div
            key={idx}
            className={`rounded-xl p-6 flex items-center justify-between shadow-sm ${wrapperClass}`}
          >
            
            <div className="flex items-start gap-4">
              
              {rank <= 3 && <div className="mt-1">{badge}</div>}

              
              {rank > 3 && (
                <span className="text-gray-500 text-lg font-semibold w-6">
                  {rank}
                </span>
              )}

              <div>
                <h2 className="font-semibold text-lg">{user.name}</h2>
                <p className="text-gray-500 text-sm">
                  {user.team} • {user.project}
                </p>

                <div className="flex gap-6 mt-2 text-sm">
                  <p>
                    <span className="text-gray-500">Commits:</span>{" "}
                    <span className="text-blue-600">{user.commits}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">PRs:</span>{" "}
                    <span className="text-green-600">{user.prs}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Reviews:</span>{" "}
                    <span className="text-orange-500">{user.reviews}</span>
                  </p>
                </div>
              </div>
            </div>

            
            <div className="text-right">
              <p className="text-2xl font-bold">{user.total}</p>
              <p className="text-gray-400 text-sm">Total</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaderboardCard;
