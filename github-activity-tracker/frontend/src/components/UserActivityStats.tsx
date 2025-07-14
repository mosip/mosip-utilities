import React from 'react';
import { User, GitCommit, GitPullRequest, MessageSquare } from 'lucide-react';
import type { ActivityItem } from '../lib/database.types';

interface UserStats {
  name: string;
  commits: number;
  pullRequests: number;
  reviews: number;
}

interface UserActivityStatsProps {
  activities: ActivityItem[];
}

export function UserActivityStats({ activities }: UserActivityStatsProps) {
  // Calculate stats per user
  const userStats = activities.reduce<Record<string, UserStats>>((acc, activity) => {
    if (!acc[activity.author]) {
      acc[activity.author] = {
        name: activity.author,
        commits: 0,
        pullRequests: 0,
        reviews: 0,
      };
    }

    switch (activity.type) {
      case 'commit':
        acc[activity.author].commits++;
        break;
      case 'pull_request':
        acc[activity.author].pullRequests++;
        break;
      case 'review':
        acc[activity.author].reviews++;
        break;
    }

    return acc;
  }, {});

  // Convert to array and sort by total activity
  const sortedUsers = Object.values(userStats).sort((a, b) => {
    const totalA = a.commits + a.pullRequests + a.reviews;
    const totalB = b.commits + b.pullRequests + b.reviews;
    return totalB - totalA;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pull Requests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reviews
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No user activity found
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GitCommit className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.commits}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GitPullRequest className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.pullRequests}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.reviews}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}