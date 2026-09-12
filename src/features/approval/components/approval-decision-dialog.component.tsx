import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ApprovalRequestEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  useApproveApprovalRequest,
  useRejectApprovalRequest,
} from "@/resources/gql/approval.gql";

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

type ApprovalDecisionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ApprovalRequestEntity | null;
  readOnly?: boolean;
};

export function ApprovalDecisionDialog({
  open,
  onOpenChange,
  request,
  readOnly = false,
}: ApprovalDecisionDialogProps) {
  const [notes, setNotes] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  const approve = useApproveApprovalRequest();
  const reject = useRejectApprovalRequest();
  const isSubmitting = approve.isPending || reject.isPending;

  if (open !== prevOpen) {
    setPrevOpen(open);

    if (open) {
      setNotes("");
    }
  }

  async function handleDecision(decision: "approve" | "reject") {
    if (!request) {
      return;
    }

    try {
      if (decision === "approve") {
        await approve.mutateAsync({ id: request.id, notes: notes.trim() || undefined });
        toast.success("Approval request approved");
      } else {
        await reject.mutateAsync({ id: request.id, notes: notes.trim() || undefined });
        toast.success("Approval request rejected");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to record decision", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Approval request</DialogTitle>
          <DialogDescription>
            Review the request and record an approve or reject decision.
          </DialogDescription>
        </DialogHeader>

        {request ? (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary">{request.type.replaceAll("_", " ")}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Requested by</span>
                <span className="font-medium">{request.requestedByUserName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Requested at</span>
                <span className="font-medium">{formatDate(request.requestedAt)}</span>
              </div>
              {request.reason ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium">{request.reason}</span>
                </div>
              ) : null}
              {request.notes ? (
                <div>
                  <span className="text-muted-foreground">Requester notes</span>
                  <p className="mt-1 font-medium">{request.notes}</p>
                </div>
              ) : null}
              {readOnly && request.decisionNotes ? (
                <div>
                  <span className="text-muted-foreground">Decision notes</span>
                  <p className="mt-1 font-medium">{request.decisionNotes}</p>
                </div>
              ) : null}
              {readOnly && request.failureReason ? (
                <div>
                  <span className="text-muted-foreground">Failure reason</span>
                  <p className="mt-1 font-medium text-destructive">
                    {request.failureReason}
                  </p>
                </div>
              ) : null}
            </div>

            {readOnly ? null : (
              <div className="grid gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="decision-notes">
                  Decision notes (optional)
                </label>
                <Textarea
                  id="decision-notes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add context for this decision"
                  value={notes}
                />
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          {readOnly ? (
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          ) : (
            <>
              <Button
                disabled={isSubmitting}
                onClick={() => handleDecision("reject")}
                variant="outline"
              >
                {reject.isPending ? "Rejecting..." : "Reject"}
              </Button>
              <Button disabled={isSubmitting} onClick={() => handleDecision("approve")}>
                {approve.isPending ? "Approving..." : "Approve"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
