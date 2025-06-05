import React from 'react';
import { Car as Card } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

export function ActivityCard({ title, count, children }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {count}
        </span>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
