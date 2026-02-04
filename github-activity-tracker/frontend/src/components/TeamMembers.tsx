import React from "react";


const teamData = [
  {
    name: "Alice Johnson",
    email: "alice.johnson@company.com",
    team: "Frontend",
    project: "Alpha",
    role: "Senior Developer",
    commits: 95,
    prs: 18,
    reviews: 44,
    diffCommits: +2,
    diffPRs: -20,
    diffReviews: -12,
  },
  {
    name: "Bob Smith",
    email: "bob.smith@company.com",
    team: "Backend",
    project: "Alpha",
    role: "Tech Lead",
    commits: 31,
    prs: 15,
    reviews: 32,
    diffCommits: -34,
    diffPRs: -3,
    diffReviews: -7,
  },
  {
    name: "Carol Williams",
    email: "carol.williams@company.com",
    team: "Frontend",
    project: "Beta",
    role: "Junior Developer",
    commits: 32,
    prs: 9,
    reviews: 15,
    diffCommits: -6,
    diffPRs: 0,
    diffReviews: -1,
  },
  {
    name: "David Brown",
    email: "david.brown@company.com",
    team: "Backend",
    project: "Beta",
    role: "Senior Developer",
    commits: 11,
    prs: 4,
    reviews: 9,
    diffCommits: -6,
    diffPRs: -2,
    diffReviews: +4,
  },
  {
    name: "Emma Davis",
    email: "emma.davis@company.com",
    team: "DevOps",
    project: "Alpha",
    role: "DevOps Engineer",
    commits: 50,
    prs: 18,
    reviews: 31,
    diffCommits: 0,
    diffPRs: 0,
    diffReviews: +5,
  },
  {
    name: "Frank Miller",
    email: "frank.miller@company.com",
    team: "Frontend",
    project: "Gamma",
    role: "Developer",
    commits: 45,
    prs: 7,
    reviews: 23,
    diffCommits: -10,
    diffPRs: -18,
    diffReviews: 0,
  },
  {
    name: "Grace Lee",
    email: "grace.lee@company.com",
    team: "Backend",
    project: "Gamma",
    role: "Architect",
    commits: 60,
    prs: 15,
    reviews: 20,
    diffCommits: -1,
    diffPRs: +4,
    diffReviews: -23,
  },
  {
    name: "Henry Wilson",
    email: "henry.wilson@company.com",
    team: "DevOps",
    project: "Beta",
    role: "Senior DevOps Engineer",
    commits: 9,
    prs: 1,
    reviews: 7,
    diffCommits: -2,
    diffPRs: -4,
    diffReviews: +2,
  },
];


const UserIcon = () => (
  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white">
    👤
  </div>
);


interface TeamMembersProps {
  team: string;
  project: string;
  onSelectUser?: (name: string) => void;
}

const TeamMembers: React.FC<TeamMembersProps> = ({
  team,
  project,
  onSelectUser,
}) => {
  const filtered = teamData.filter((m) => {
    const matchTeam =
      team === "all" || m.team.toLowerCase() === team.toLowerCase();
    const matchProject =
      project === "all" || m.project.toLowerCase() === project.toLowerCase();
    return matchTeam && matchProject;
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
      <h2 className="text-2xl font-bold mb-6">Team Members</h2>

      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-600 border-b">
            <th className="pb-3">Team Member</th>
            <th className="pb-3">Team</th>
            <th className="pb-3">Project</th>
            <th className="pb-3">Role</th>
            <th className="pb-3">Commits</th>
            <th className="pb-3">PRs</th>
            <th className="pb-3">Reviews</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((m, index) => (
            <tr
              key={index}
              className="border-b last:border-0 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => onSelectUser?.(m.name)} 
            >
              <td className="py-4 flex items-center gap-3">
                <UserIcon />
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-gray-500 text-sm">{m.email}</p>
                </div>
              </td>

              <td>{m.team}</td>
              <td>{m.project}</td>
              <td>{m.role}</td>

              <td className="font-semibold text-green-600">
                {m.commits}
                <span
                  className={`ml-1 text-sm ${
                    m.diffCommits >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  ({m.diffCommits >= 0 ? "+" : ""}
                  {m.diffCommits})
                </span>
              </td>

              <td className="font-semibold text-blue-600">
                {m.prs}
                <span
                  className={`ml-1 text-sm ${
                    m.diffPRs >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  ({m.diffPRs >= 0 ? "+" : ""}
                  {m.diffPRs})
                </span>
              </td>

              <td className="font-semibold text-orange-600">
                {m.reviews}
                <span
                  className={`ml-1 text-sm ${
                    m.diffReviews >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  ({m.diffReviews >= 0 ? "+" : ""}
                  {m.diffReviews})
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamMembers;
