"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileSpreadsheet, Clock, Database } from "lucide-react";
import { useDeleteSession } from "@/hooks/useSessions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function SessionDetailsCard({ session, onClear }: { session: any; onClear: () => void }) {
  const deleteSession = useDeleteSession();

  const handleDelete = () => {
    deleteSession.mutate(session.id, {
      onSuccess: () => {
        toast.success("Session deleted and files cleaned up.");
        onClear();
      },
      onError: () => {
        toast.error("Failed to delete session.");
      }
    });
  };

  const expiresTime = new Date(session.expires_at);
  const isExpired = expiresTime < new Date();

  return (
    <Card className="border-indigo-500/20 bg-slate-900/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
            {session.original_filename}
          </CardTitle>
          <CardDescription className="text-slate-400 mt-1">
            Session ID: {session.id}
          </CardDescription>
        </div>
        <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleteSession.isPending}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <span className="text-slate-500">Rows</span>
            <span className="text-lg font-semibold text-slate-200">{session.row_count.toLocaleString()}</span>
          </div>
          <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <span className="text-slate-500">Columns</span>
            <span className="text-lg font-semibold text-slate-200">{session.column_count.toLocaleString()}</span>
          </div>
          <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <span className="text-slate-500">File Size</span>
            <span className="text-lg font-semibold text-slate-200">{(session.file_size / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <span className="text-slate-500">Status</span>
            <span className={`text-lg font-semibold ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
              {isExpired ? 'Expired' : 'Active'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-4 w-4" />
          <span>
            {isExpired 
              ? `Expired ${formatDistanceToNow(expiresTime, { addSuffix: true })}` 
              : `Expires in ${formatDistanceToNow(expiresTime)}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
