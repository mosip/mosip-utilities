export interface Repository {
  id: string;
  name: string;
  created_at: string;
}

export interface Activity {
  id: string;
  repo_name: string;
  type: string;
  author: string;
  created_at: string;
  branch?: string;
  message?: string;
  title?: string;
  state?: string;
  comment?: string;
}

export interface ActivityItem {
  type: 'commit' | 'pull_request' | 'issue' | 'review';
  title: string;
  author: string;
  date: string;
  repository: string;
  state?: string;
}