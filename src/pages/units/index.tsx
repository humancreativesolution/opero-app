import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Ruler, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table.component";
import { PermissionGate } from "@/components/rbac/components/permission-gate.component";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UnitFormSheet } from "@/features/unit/components/unit-form-sheet.component";
import type { UnitEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { useRemoveUnit, useUnits } from "@/resources/gql/unit.gql";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

export default function UnitsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitEntity | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<UnitEntity | null>(null);
  const unitsQuery = useUnits({ page, limit });
  const removeUnit = useRemoveUnit();
  const canUpdateUnit = canAccess({ anyOf: [PERMISSIONS.units.update] });
  const canDeleteUnit = canAccess({ anyOf: [PERMISSIONS.units.delete] });
  const filteredUnits = useMemo(() => {
    const units = unitsQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return units;
    }

    return units.filter((unit) =>
      [unit.code, unit.name].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [search, unitsQuery.data?.data]);

  function handleCreate() {
    setSelectedUnit(null);
    setSheetOpen(true);
  }

  function handleEdit(unit: UnitEntity) {
    setSelectedUnit(unit);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteUnit) {
      return;
    }

    try {
      await removeUnit.mutateAsync(deleteUnit.id);
      toast.success("Unit deleted");
      setDeleteUnit(null);
    } catch (error) {
      toast.error("Failed to delete unit", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  const columns = useMemo<ColumnDef<UnitEntity>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "outline"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canUpdateUnit ? (
              <Button
                onClick={() => handleEdit(row.original)}
                size="icon-sm"
                variant="ghost"
              >
                <Edit className="size-4" />
                <span className="sr-only">Edit unit</span>
              </Button>
            ) : null}
            {canDeleteUnit ? (
              <Button
                onClick={() => setDeleteUnit(row.original)}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2 className="size-4 text-destructive" />
                <span className="sr-only">Delete unit</span>
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDeleteUnit, canUpdateUnit],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Units</h1>
          <p className="text-sm text-muted-foreground">
            Manage product measurement units used by catalog, POS, purchasing, and stock.
          </p>
        </div>
        <PermissionGate anyOf={[PERMISSIONS.units.create]}>
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Create unit
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="size-4 text-muted-foreground" />
            Unit master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredUnits}
            emptyMessage="No units found."
            isLoading={unitsQuery.isLoading}
            pagination={{
              meta: unitsQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search code or name"
                  value={search}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <UnitFormSheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        unit={selectedUnit}
      />

      <Dialog onOpenChange={(open) => !open && setDeleteUnit(null)} open={Boolean(deleteUnit)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete unit</DialogTitle>
            <DialogDescription>
              This will remove unit "{deleteUnit?.name}". Units already used by products may be rejected by backend.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={removeUnit.isPending}
              onClick={() => setDeleteUnit(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={removeUnit.isPending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
