import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useChatHistory = (sessionId: string) => {
  return useQuery({
    queryKey: ["chatHistory", sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/sessions/${sessionId}/ai/history`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
};

export const useQueryAI = (sessionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (question: string) => {
      const { data } = await api.post(`/sessions/${sessionId}/ai/query`, { question });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory", sessionId] });
    },
  });
};
