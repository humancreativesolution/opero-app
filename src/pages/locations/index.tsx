import type { ColumnDef } from "@tanstack/react-table";
import { Edit, MapPin, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocationFormSheet } from "@/features/location/components/location-form-sheet.component";
import type { LocationEntity } from "@/graphql/generated";
import { useLocations } from "@/resources/gql/location.gql";

export default function LocationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationEntity | null>(null);
  const locationsQuery = useLocations({ page, limit });
  const filteredLocations = useMemo(() => {
    const locations = locationsQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return locations;
    }

    return locations.filter((location) =>
      [location.name, location.type].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [locationsQuery.data?.data, search]);

  function handleCreate() {
    setSelectedLocation(null);
    setSheetOpen(true);
  }

  function handleEdit(location: LocationEntity) {
    setSelectedLocation(location);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<LocationEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Location",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) =>
          new Intl.DateTimeFormat("en", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(String(row.original.createdAt))),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              onClick={() => handleEdit(row.original)}
              size="icon-sm"
              variant="ghost"
            >
              <Edit className="size-4" />
              <span className="sr-only">Edit location</span>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Manage outlets, stores, and warehouses used by POS and inventory.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Create location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-muted-foreground" />
            Location master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredLocations}
            emptyMessage="No locations found."
            isLoading={locationsQuery.isLoading}
            pagination={{
              meta: locationsQuery.data?.meta,
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
                  placeholder="Search name or type"
                  value={search}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <LocationFormSheet
        location={selectedLocation}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
      />
    </div>
  );
}
