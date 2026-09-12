import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, Inbox, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import { ApprovalDecisionDialog } from "@/features/approval/components/approval-decision-dialog.component";
import type { ApprovalRequestEntity, ApprovalRequestStatus } from "@/graphql/generated";
import {
  useApprovalRequests,
  useMyApprovalRequests,
} from "@/resources/gql/approval.gql";

const ALL_VALUE = "__all";

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

function getStatusClassName(status: ApprovalRequestStatus) {
  if (status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (status === "REJECTED" || status === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

type ApprovalsView = "pending" | "mine";

export default function ApprovalsPage() {
  const canApprove = canAccess({ anyOf: [PERMISSIONS.approvals.approve] });
  const canReadAll = canAccess({ anyOf: [PERMISSIONS.approvals.read] });
  const [view, setView] = useState<ApprovalsView>(
    canApprove || canReadAll ? "pending" : "mine",
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<"" | ApprovalRequestStatus>("");
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestEntity | null>(
    null,
  );

  const allRequestsQuery = useApprovalRequests(
    { page, limit, filter: { status: status || undefined } },
  );
  const myRequestsQuery = useMyApprovalRequests(
    { page, limit, filter: { status: status || undefined } },
  );
  const activeQuery = view === "pending" ? allRequestsQuery : myRequestsQuery;

  function resetPage() {
    setPage(1);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<ApprovalRequestEntity>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.type.replaceAll("_", " ")}</Badge>
        ),
      },
      {
        accessorKey: "requestedByUserName",
        header: "Requested by",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.requestedByUserName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(row.original.requestedAt)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={getStatusClassName(row.original.status)} variant="outline">
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "decidedByUserName",
        header: "Decided by",
        cell: ({ row }) => (
          <div>
            <p>{row.original.decidedByUserName ?? "-"}</p>
            {row.original.decidedAt ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(row.original.decidedAt)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => row.original.reason || "-",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              onClick={() => setSelectedRequest(row.original)}
              size="sm"
              variant="outline"
            >
              {view === "pending" && row.original.status === "PENDING" && canApprove
                ? "Review"
                : "Detail"}
            </Button>
          </div>
        ),
      },
    ],
    [canApprove, view],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review and decide on sale return, stock adjustment, and cash-out
            approval requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canApprove || canReadAll ? (
            <Button
              onClick={() => {
                setView("pending");
                resetPage();
              }}
              variant={view === "pending" ? "default" : "outline"}
            >
              <Inbox className="size-4" />
              Pending decisions
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setView("mine");
              resetPage();
            }}
            variant={view === "mine" ? "default" : "outline"}
          >
            <ListChecks className="size-4" />
            My requests
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="size-4 text-muted-foreground" />
            {view === "pending" ? "All approval requests" : "My approval requests"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={activeQuery.data?.data ?? []}
            emptyMessage="No approval requests found."
            isLoading={activeQuery.isLoading}
            pagination={{
              meta: activeQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <Select
                onValueChange={(value) => {
                  setStatus(value === ALL_VALUE ? "" : (value as ApprovalRequestStatus));
                  resetPage();
                }}
                value={status || ALL_VALUE}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </CardContent>
      </Card>

      <ApprovalDecisionDialog
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        open={Boolean(selectedRequest)}
        readOnly={
          !(view === "pending" && canApprove && selectedRequest?.status === "PENDING")
        }
        request={selectedRequest}
      />
    </div>
  );
}
