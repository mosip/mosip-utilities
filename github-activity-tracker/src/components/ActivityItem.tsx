import React from 'react';
import { GitCommit, GitPullRequest, AlertCircle, MessageSquare, User } from 'lucide-react';
import type { ActivityItem } from '../lib/database.types';

interface ActivityItemProps {
  type: ActivityItem['type'];
  title: string;
  author: string;
  repository: string;
  state?: string;
}

const icons = {
  commit: GitCommit,
  pull_request: GitPullRequest,
  issue: AlertCircle,
  review: MessageSquare,
};

export function ActivityItem({ type, title, author, repository, state }: ActivityItemProps) {
  const Icon = icons[type];
  
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <div className="flex items-center mt-1 space-x-2">
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-400 mr-1" />
            <p className="text-sm text-gray-500">{author}</p>
          </div>
          <p className="text-sm text-gray-500">in {repository}</p>
          {type === 'pull_request' && state && (
            <span className="text-sm text-gray-500">({state})</span>
          )}
        </div>
      </div>
    </div>
  );
}