import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRepositories, fetchActivityData } from './api';
import type { Repository, Activity, ActivityItem } from './database.types';

// Hook to fetch all repositories
export const useRepositories = () => {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const data = await fetchRepositories();
      return data; // Expect [{ id: string, name: string, created_at: string }, ...]
    },
  });
};

// Activity aggregation hook
export function useGitHubActivity(
  selectedRepo: string,
  dateRange: string,
  startDate?: string,
  endDate?: string,
  shouldFetchData: boolean = true,
  searchUsername: string = '',
  selectedRepos: string[] = [],
  selectedUsers: string[] = []
): { activities: ActivityItem[]; loading: boolean; error: string | null } {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetchData) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // For custom range, only proceed if both dates are provided
        if (dateRange === 'custom' && (!startDate || !endDate)) {
          setLoading(false);
          return;
        }

        // Fetch activities from the backend
        const data = await fetchActivityData(
          selectedRepo,
          dateRange,
          startDate,
          endDate,
          searchUsername,
          selectedRepos,
          selectedUsers
        );

        if (signal.aborted) return;

        // Map Activity to ActivityItem
        const mappedActivities: ActivityItem[] = data.map((activity: Activity) => ({
          type:
            activity.type === 'commit'
              ? 'commit'
              : activity.type === 'pull_request'
              ? 'pull_request'
              : activity.type === 'issue'
              ? 'issue'
              : 'review',
          title: activity.message || activity.title || activity.comment || 'No title',
          author: activity.author,
          date: activity.created_at,
          repository: activity.repo_name,
          state: activity.state,
        }));

        // Sort activities by date (latest first)
        setActivities(
          mappedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
      } catch (err: any) {
        if (signal.aborted) return;
        console.error('Error fetching GitHub activity:', err);
        setError(err.message || 'Failed to fetch activity data');
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [selectedRepo, dateRange, startDate, endDate, shouldFetchData, searchUsername, selectedRepos, selectedUsers]);

  return { activities, loading, error };
}