import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useUploadDataset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/sessions/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["session", data.id], data);
    },
  });
};

export const useSession = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await api.get(`/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: 30000, // Polling to check status/expiry
  });
};

export const useDatasetPreview = (sessionId: string | null, limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: ["datasetPreview", sessionId, limit, offset],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await api.get(`/sessions/${sessionId}/preview`, {
        params: { limit, offset }
      });
      return data;
    },
    enabled: !!sessionId,
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/sessions/${sessionId}`);
    },
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: ["session", sessionId] });
      queryClient.removeQueries({ queryKey: ["datasetPreview", sessionId] });
      queryClient.removeQueries({ queryKey: ["datasetProfile", sessionId] });
    },
  });
};

export const useDatasetProfile = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["datasetProfile", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await api.get(`/sessions/${sessionId}/profile`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Profiles are static for the session
  });
};

export const useColumnSummaries = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["columnSummaries", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await api.get(`/sessions/${sessionId}/columns`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: Infinity,
  });
};

export const useColumnDetails = (sessionId: string | null, columnName: string | null) => {
  return useQuery({
    queryKey: ["columnDetails", sessionId, columnName],
    queryFn: async () => {
      if (!sessionId || !columnName) return null;
      const { data } = await api.get(`/columns/${sessionId}/${encodeURIComponent(columnName)}`);
      return data;
    },
    enabled: !!sessionId && !!columnName,
    staleTime: Infinity,
  });
};
