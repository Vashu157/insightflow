import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useInsights = (sessionId: string) => {
  return useQuery({
    queryKey: ["insights", sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/sessions/${sessionId}/insights`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry 404s
  });
};

export const useRefreshInsights = (sessionId: string) => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/jobs/report/${sessionId}`);
      return data; // Returns JobCreateResponse
    },
  });
};
