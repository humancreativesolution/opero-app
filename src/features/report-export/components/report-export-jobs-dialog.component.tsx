import { Download, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReportExportJobSummaryEntity, SalesReportFilterInput } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  fetchReportExportJob,
  useCreateSalesReportItemsExport,
  useCreateSalesReportTransactionsExport,
  useReportExportJobs,
} from "@/resources/gql/report-export.gql";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getStatusClassName(status: ReportExportJobSummaryEntity["status"]) {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (status === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DownloadJobButton({ jobId, fileName }: { jobId: string; fileName?: string | null }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);

    try {
      const job = await fetchReportExportJob(jobId);

      if (job.content) {
        downloadCsv(fileName ?? `${jobId}.csv`, job.content);
      } else {
        toast.error("Export file is not available");
      }
    } catch (error) {
      toast.error("Failed to download export", {
        description: ErrorHelper.parse(error).message,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button disabled={isDownloading} onClick={handleDownload} size="sm" variant="outline">
      {isDownloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Download
    </Button>
  );
}

type ReportExportJobsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: SalesReportFilterInput;
};

export function ReportExportJobsDialog({
  open,
  onOpenChange,
  filter,
}: ReportExportJobsDialogProps) {
  const jobsQuery = useReportExportJobs({ limit: 20 }, open ? 5_000 : undefined);
  const createTransactionsExport = useCreateSalesReportTransactionsExport();
  const createItemsExport = useCreateSalesReportItemsExport();
  const jobs = jobsQuery.data?.data ?? [];

  async function handleCreateExport(type: "transactions" | "items") {
    try {
      if (type === "transactions") {
        await createTransactionsExport.mutateAsync(filter);
      } else {
        await createItemsExport.mutateAsync(filter);
      }
      toast.success("Export job queued");
    } catch (error) {
      toast.error("Failed to queue export job", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Async report export</DialogTitle>
          <DialogDescription>
            Queue large exports as background jobs and download them once completed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={createTransactionsExport.isPending}
            onClick={() => handleCreateExport("transactions")}
            size="sm"
          >
            Queue transactions export
          </Button>
          <Button
            disabled={createItemsExport.isPending}
            onClick={() => handleCreateExport("items")}
            size="sm"
            variant="outline"
          >
            Queue items export
          </Button>
          <Button
            className="ml-auto"
            onClick={() => jobsQuery.refetch()}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {jobs.length === 0 ? (
            <p className="rounded-lg border p-3 text-sm text-muted-foreground">
              No export jobs yet.
            </p>
          ) : (
            jobs.map((job) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                key={job.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{job.fileName ?? job.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(job.createdAt)}
                    {job.requestedByUserName ? ` · ${job.requestedByUserName}` : ""}
                  </p>
                  {job.errorMessage ? (
                    <p className="text-xs text-destructive">{job.errorMessage}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusClassName(job.status)} variant="outline">
                    {job.status}
                  </Badge>
                  {job.isDownloadable ? (
                    <DownloadJobButton fileName={job.fileName} jobId={job.id} />
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
