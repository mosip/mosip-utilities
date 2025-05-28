import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ActivityItem } from '../lib/database.types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ActivityChartProps {
  activities: ActivityItem[];
}

const ActivityChart: React.FC<ActivityChartProps> = ({ activities }) => {
  // Process activities to get per-user stats
  const userStats = activities.reduce((acc, activity) => {
    if (!acc[activity.author]) {
      acc[activity.author] = {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0, // Added for consistency
      };
    }

    switch (activity.type) {
      case 'commit':
        acc[activity.author].commits++;
        break;
      case 'pull_request':
        acc[activity.author].pullRequests++;
        break;
      case 'issue':
        acc[activity.author].issues++;
        break;
      case 'review':
        acc[activity.author].reviews++;
        break;
      default:
        break;
    }

    return acc;
  }, {} as Record<string, { commits: number; pullRequests: number; issues: number; reviews: number }>);

  const users = Object.keys(userStats);
  
  const chartData = {
    labels: users,
    datasets: [
      {
        label: 'Commits',
        data: users.map(user => userStats[user].commits),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Pull Requests',
        data: users.map(user => userStats[user].pullRequests),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: 'Issues',
        data: users.map(user => userStats[user].issues),
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
      {
        label: 'Reviews',
        data: users.map(user => userStats[user].reviews),
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Activity Overview',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Users',
          font: {
            size: 14,
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Activities',
          font: {
            size: 14,
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default ActivityChart;