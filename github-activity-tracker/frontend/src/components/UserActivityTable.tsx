
import React from "react";

interface Row {
  date: string;
  commits: number;
  prs: number;
  reviews: number;
  total: number;
}

interface Props {
  rows: Row[];
}

const UserActivityTable: React.FC<Props> = ({ rows }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Detailed Activity</h2>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-gray-600 border-b">
            <th className="pb-2">Date</th>
            <th className="pb-2">Commits</th>
            <th className="pb-2">Pull Requests</th>
            <th className="pb-2">Reviews</th>
            <th className="pb-2">Total</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b text-gray-800">
              <td className="py-2">{r.date}</td>
              <td className="py-2">{r.commits}</td>
              <td className="py-2">{r.prs}</td>
              <td className="py-2">{r.reviews}</td>
              <td className="py-2 font-semibold">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserActivityTable;
