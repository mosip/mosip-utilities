import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface TrendPoint {
  date: string;
  commits: number;
  prs: number;
  reviews: number;
}

interface ActivityTrendProps {
  data: TrendPoint[];
}

const ActivityTrend: React.FC<ActivityTrendProps> = ({ data }) => {
  const labels = data.map((d) => d.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Commits",
        data: data.map((d) => d.commits),
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.4,
        pointRadius: 4,
        pointBorderWidth: 2,
      },
      {
        label: "Pull Requests",
        data: data.map((d) => d.prs),
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        tension: 0.4,
        pointRadius: 4,
        pointBorderWidth: 2,
      },
      {
        label: "Reviews",
        data: data.map((d) => d.reviews),
        borderColor: "#f59e0b",
        backgroundColor: "#f59e0b",
        tension: 0.4,
        pointRadius: 4,
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        grid: {
          borderDash: [6, 6],
          color: "#e5e7eb",
        },
      },
    },
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm mb-8">
      <h2 className="text-xl font-semibold mb-4">Activity Trend</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ActivityTrend;
