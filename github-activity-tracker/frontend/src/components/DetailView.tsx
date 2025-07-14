import React from 'react';
import { format } from 'date-fns';
import type { ActivityItem } from '../lib/database.types';
import Modal from './Modal';

interface DetailViewProps {
  type: 'commit' | 'pull_request' | 'issue' | 'review' | null;
  data: ActivityItem[] | null;
  onClose: () => void;
}

const DetailView: React.FC<DetailViewProps> = ({ type, data, onClose }) => {
  if (!type || !data || data.length === 0) {
    return (
      <Modal onClose={onClose}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">No Data Available</h2>
          <p className="text-gray-500">No activities found for this type.</p>
        </div>
      </Modal>
    );
  }

  const typeLabels: Record<NonNullable<DetailViewProps['type']>, string> = {
    commit: 'Commits',
    pull_request: 'Pull Requests',
    issue: 'Issues',
    review: 'Reviews',
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{typeLabels[type]}</h2>
        <ul className="overflow-y-auto max-h-80 space-y-4">
          {data.map((item, index) => (
            <li key={`${item.type}-${index}`} className="border-b border-gray-200 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 font-medium">{item.title}</span>
                <span className="text-gray-500 text-sm">by {item.author}</span>
                <span className="text-gray-500 text-sm">{format(new Date(item.date), 'MMM d, yyyy')}</span>
              </div>
              {item.type === 'pull_request' && item.state && (
                <div className="mt-1">
                  <span className="text-gray-500 text-sm">State: {item.state}</span>
                </div>
              )}
              {item.type === 'review' && (
                <div className="mt-1">
                  <span className="text-gray-500 text-sm">Repository: {item.repository}</span>
                </div>
              )}
              {item.type === 'issue' && (
                <div className="mt-1">
                  <span className="text-gray-500 text-sm">Repository: {item.repository}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default DetailView;