import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Fetch list of repositories
export const fetchRepositories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/repositories`);
    return response.data; // Expect [{ id: string, name: string, created_at: string }, ...]
  } catch (error) {
    throw new Error('Failed to fetch repositories');
  }
};

// Fetch a single repository by ID
export const fetchRepository = async (id: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/repository/${id}`);
    return response.data; // Expect { id: string, name: string, created_at: string }
  } catch (error) {
    throw new Error('Failed to fetch repository');
  }
};

// Fetch unique users
export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`);
    return response.data; // Expect string[]
  } catch (error) {
    throw new Error('Failed to fetch users');
  }
};

// Fetch activity data
export const fetchActivityData = async (
  repo: string,
  dateRange: string,
  startDate?: string,
  endDate?: string,
  username?: string,
  repos: string[] = [],
  users: string[] = []
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/activity`, {
      params: {
        repo,
        dateRange,
        startDate,
        endDate,
        username,
        repos: repos.join(','),
        users: users.join(',')
      }
    });
    return response.data; // Expect [{ id: string, repo_name: string, type: string, author: string, created_at: string, ... }, ...]
  } catch (error) {
    throw new Error('Failed to fetch activity data');
  }
};

// Fetch repository stats
export const fetchRepositoryStats = async (repositoryId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/stats/${repositoryId}`);
    return response.data; // Expect { commits: number, issues: number, pullRequests: number, reviews: number }
  } catch (error) {
    throw new Error('Failed to fetch repository stats');
  }
};

// Add a new repository
export const addRepository = async (repoName: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/addRepo`, { repoName });
    return response.data; // Expect { success: boolean, message?: string }
  } catch (error) {
    throw new Error('Failed to add repository');
  }
};