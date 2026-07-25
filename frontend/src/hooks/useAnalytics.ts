import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useDashboardSummary = (sessionId: string) => {
  return useQuery({
    queryKey: ["dashboardSummary", sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/sessions/${sessionId}/dashboard`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: Infinity,
  });
};

export const useSavedCharts = (sessionId: string) => {
  return useQuery({
    queryKey: ["savedCharts", sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/sessions/${sessionId}/charts`);
      return data;
    },
    enabled: !!sessionId,
  });
};

export const useSaveCharts = (sessionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (charts: any[]) => {
      const { data } = await api.post(`/sessions/${sessionId}/charts/save`, charts);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCharts", sessionId] });
    },
  });
};

export const useChartData = (sessionId: string, chartConfig: any) => {
  return useQuery({
    queryKey: ["chartData", sessionId, chartConfig],
    queryFn: async () => {
      const { data } = await api.post(`/sessions/${sessionId}/chart`, chartConfig);
      return data;
    },
    enabled: !!sessionId && !!chartConfig,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTableData = (sessionId: string, request: any) => {
  return useQuery({
    queryKey: ["tableData", sessionId, request],
    queryFn: async () => {
      const { data } = await api.post(`/sessions/${sessionId}/table`, request);
      return data;
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000,
  });
};
