"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileSpreadsheet, CheckCircle2, Loader2, Sparkles } from "lucide-react";
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
  const [isCompleted, setIsCompleted] = useState(false);
  const uploadDataset = useUploadDataset();
  const { jobStatus } = useJobWebSocket(activeSessionId);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fakeProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
    };
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

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
      setCurrentStage("Uploading");
      if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
      fakeProgressIntervalRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 10));
      }, 200);

      uploadDataset.mutate(file, {
        onSuccess: async (data) => {
          // File is uploaded. Now start the profiling job.
          setCurrentStage("Queued");
          setActiveSessionId(data.id);
          try {
            const res = await api.post(`/jobs/profile/${data.id}`);
            const jobId = res.data.job_id;
            
            // Fallback polling in case WebSocket connection is too slow
            pollIntervalRef.current = setInterval(async () => {
              try {
                const jobRes = await api.get(`/jobs/${jobId}`);
                if (jobRes.data.status === "COMPLETED") {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
                  setProgress(100);
                  setIsCompleted(true);
                  toast.success("Dataset processed successfully!");
                  setTimeout(() => onUploadSuccess(data.id), 500);
                } else if (jobRes.data.status === "FAILED") {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
                  toast.error(`Processing failed: ${jobRes.data.error_message || "Unknown error"}`);
                  setProgress(0);
                } else {
                  if (jobRes.data.progress !== undefined && jobRes.data.progress !== null) {
                    setProgress(jobRes.data.progress);
                  }
                }
              } catch (e) {
                console.error("Failed to poll job status:", e);
              }
            }, 1000);
            
          } catch (err) {
             if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
             toast.error("Failed to start profiling job.");
             setProgress(0);
          }
        },
        onError: (err: any) => {
          if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
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
      
      if (jobStatus.payload.status === "COMPLETED") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
        setProgress(100);
        setIsCompleted(true);
        toast.success("Dataset processed successfully!");
        setTimeout(() => onUploadSuccess(activeSessionId!), 500);
      } else if (jobStatus.payload.status === "FAILED") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (fakeProgressIntervalRef.current) clearInterval(fakeProgressIntervalRef.current);
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

  const isUploadingOrProcessing = uploadDataset.isPending || activeSessionId !== null;

  return (
    <Card className="border-indigo-500/20 bg-slate-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
              Upload Dataset
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Upload a CSV or Excel file to start a new analysis session.
            </CardDescription>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            Max 50MB
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-12 transition-all duration-300 ${
            isDragActive 
              ? "border-indigo-400 bg-indigo-500/15 scale-[1.01]" 
              : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 bg-slate-950/40"
          }`}
        >
          <input {...getInputProps()} />

          {!isUploadingOrProcessing ? (
            <>
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 shadow-lg transition-transform duration-300 ${isDragActive ? "scale-110" : ""}`}>
                <UploadCloud className={`h-8 w-8 ${isDragActive ? "text-indigo-300" : "text-indigo-400"}`} />
              </div>

              <p className="mb-2 text-base font-semibold text-slate-100 text-center">
                {isDragActive ? "Drop the file here to upload" : "Drag & drop your dataset here, or click to browse"}
              </p>
              
              <p className="text-xs text-slate-400 text-center mb-5">
                Support for structured tabular data files
              </p>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
                  .CSV
                </span>
                <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
                  .XLSX
                </span>
                <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
                  .XLS
                </span>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-4 space-y-5">
              {isCompleted ? (
                <div className="flex flex-col items-center space-y-2 animate-in zoom-in-95 duration-300">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">Processing Complete!</p>
                  <p className="text-xs text-slate-400">Redirecting to your workspace...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                    <span className="text-sm font-semibold text-indigo-300 tracking-wide">
                      {currentStage}...
                    </span>
                  </div>

                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden [&>div]:bg-gradient-to-r [&>div]:from-indigo-600 [&>div]:to-indigo-400 [&>div]:transition-all [&>div]:duration-300" 
                    />
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    AI profiling data schemas & statistics
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

