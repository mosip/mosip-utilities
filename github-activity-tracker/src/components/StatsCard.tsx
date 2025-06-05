import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  onClick?: () => void;
}

export function StatsCard({ title, value, icon: Icon, trend, onClick }: StatsCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `${title} card` : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" aria-hidden="true" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center" aria-label={`Trend: ${trend}% vs last week`}>
          <span className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-sm text-gray-500 ml-2">vs last week</span>
        </div>
      )}
    </div>
  );
}