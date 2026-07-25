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
  });
};

export const useRefreshInsights = (sessionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/sessions/${sessionId}/insights/refresh`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["insights", sessionId], data);
    },
  });
};
