import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  change?: number;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  onClick,
}) => {
  const isNegative = change !== undefined && change < 0;
  const isPositive = change !== undefined && change > 0;

  return (
    <div
      onClick={onClick}
      className="bg-white shadow-sm rounded-xl p-6 cursor-pointer hover:shadow-md transition-all border border-gray-200"
    >
      <p className="text-gray-600 font-medium">{title}</p>

      <p className="text-4xl font-bold text-gray-900">{value}</p>

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {isNegative && <ArrowDown size={16} className="text-red-500" />}
          {isPositive && <ArrowUp size={16} className="text-green-600" />}

          <span
            className={`text-sm font-medium ${
              isNegative
                ? "text-red-500"
                : isPositive
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            {Math.abs(change)}% vs previous period
          </span>
        </div>
      )}
    </div>
  );
};
