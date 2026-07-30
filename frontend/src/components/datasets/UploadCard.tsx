"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileType, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUploadDataset } from "@/hooks/useSessions";
import { useJobWebSocket } from "@/hooks/useWebSocket";
import api from "@/lib/api";

export default function UploadCard({ onUploadSuccess }: { onUploadSuccess: (id: string) => void }) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("Uploading");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const uploadDataset = useUploadDataset();
  const { jobStatus } = useJobWebSocket(activeSessionId);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Windows browsers can report empty or non-standard MIME types for CSV files.
      // We validate by extension as a reliable fallback.
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!hasValidExtension) {
        toast.error("Invalid file type. Please upload a CSV or Excel file.");
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error("File is too large. Maximum size is 50MB.");
        return;
      }

      // Simulate progress for UI purposes before the mutation finishes
      setProgress(10);
      const interval = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 10));
      }, 200);

      uploadDataset.mutate(file, {
        onSuccess: async (data) => {
          // File is uploaded. Now start the profiling job.
          setCurrentStage("Queued");
          setActiveSessionId(data.id);
          try {
            await api.post(`/jobs/profile/${data.id}`);
            // Wait for WebSocket to take over the progress.
            // When profiling hits 100%, we'll call onUploadSuccess.
          } catch (err) {
             toast.error("Failed to start profiling job.");
             setProgress(0);
          }
        },
        onError: (err: any) => {
          setProgress(0);
          toast.error(err.response?.data?.detail || "Failed to upload dataset.");
        },
      });
    },
    [uploadDataset]
  );

  // Listen to WebSocket updates
  useEffect(() => {
    if (jobStatus?.payload) {
      if (jobStatus.payload.progress !== undefined) {
        setProgress(jobStatus.payload.progress);
      }
      if (jobStatus.payload.current_stage) {
        setCurrentStage(jobStatus.payload.current_stage);
      }
      
      if (jobStatus.payload.status === "COMPLETED" && jobStatus.event_type === "dataset.profiled") {
        toast.success("Dataset processed successfully!");
        setTimeout(() => onUploadSuccess(activeSessionId!), 500);
      } else if (jobStatus.payload.status === "FAILED") {
        toast.error(`Processing failed: ${jobStatus.payload.error_message}`);
        setProgress(0);
      }
    }
  }, [jobStatus, activeSessionId, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  return (
    <Card className="border-indigo-500/20 bg-slate-900/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl text-white">Upload Dataset</CardTitle>
        <CardDescription className="text-slate-400">
          Upload a CSV or Excel file to start a new analysis session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
            isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`mb-4 h-12 w-12 ${isDragActive ? "text-indigo-400" : "text-slate-400"}`} />
          <p className="mb-2 text-sm font-medium text-slate-200">
            {isDragActive ? "Drop the file here" : "Drag & drop a file here, or click to browse"}
          </p>
          <p className="text-xs text-slate-500">Supported formats: CSV, XLSX (Max 50MB)</p>

          {uploadDataset.isPending || activeSessionId ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-900/90 backdrop-blur-sm px-10">
              <p className="mb-4 text-sm font-medium text-indigo-400 animate-pulse">{currentStage}...</p>
              <Progress value={progress} className="h-2 w-full bg-slate-700 [&>div]:bg-indigo-500" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
