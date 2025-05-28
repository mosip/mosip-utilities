import React, { useState } from 'react';
import { GitBranch, ChevronDown, User, Trash2 } from 'lucide-react';

interface SidebarProps {
  repositories: string[];
  users: string[];
  selectedRepos: string[];
  selectedUsers: string[];
  onSelectRepos: (repos: string[]) => void;
  onSelectUsers: (users: string[]) => void;
  onSelectRepo: (repo: string) => void;
  onDeleteUser: (user: string) => void;
}

export function Sidebar({ repositories, users, selectedRepos, selectedUsers, onSelectRepos, onSelectUsers, onSelectRepo, onDeleteUser }: SidebarProps) {
  const [repoSearchTerm, setRepoSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const filteredRepositories = repositories.filter(repo =>
    repo.toLowerCase().includes(repoSearchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleRepoCheckboxChange = (repo: string) => {
    if (selectedRepos.includes(repo)) {
      onSelectRepos(selectedRepos.filter(r => r !== repo));
    } else {
      onSelectRepos([...selectedRepos, repo]);
    }
  };

  const handleUserCheckboxChange = (user: string) => {
    if (selectedUsers.includes(user)) {
      onSelectUsers(selectedUsers.filter(u => u !== user));
    } else {
      onSelectUsers([...selectedUsers, user]);
    }
  };

  const handleDeleteUserClick = (user: string) => {
    onDeleteUser(user);
  };

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <GitBranch className="w-5 h-5 mr-2" />
          Repositories
        </h2>
        <input
          type="text"
          placeholder="Search repositories..."
          value={repoSearchTerm}
          onChange={(e) => setRepoSearchTerm(e.target.value)}
          className="mt-2 w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        <div className="p-2">
          <button
            onClick={() => onSelectRepo('all')}
            className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
              selectedRepos.length === 0
                ? 'bg-blue-50 text-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            All Repositories
          </button>
          {filteredRepositories.map((repo) => (
            <label key={repo} className="flex items-center w-full mb-1">
              <input
                type="checkbox"
                value={repo}
                checked={selectedRepos.includes(repo)}
                onChange={() => handleRepoCheckboxChange(repo)}
                className="mr-2"
              />
              <span className="text-sm">{repo}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Users
        </h2>
        <input
          type="text"
          placeholder="Search users..."
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          className="mt-2 w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        <div className="p-2">
          {filteredUsers.map((user) => (
            <div key={user} className="flex items-center justify-between w-full mb-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value={user}
                  checked={selectedUsers.includes(user)}
                  onChange={() => handleUserCheckboxChange(user)}
                  className="mr-2"
                />
                <span className="text-sm">{user}</span>
              </label>
              <button
                onClick={() => handleDeleteUserClick(user)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
