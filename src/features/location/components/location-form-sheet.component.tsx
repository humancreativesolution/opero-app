import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  locationFormSchema,
  type LocationFormValues,
} from "@/features/location/schemas/location-form.schema";
import type { LocationEntity, LocationType } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  useCreateLocation,
  useUpdateLocation,
} from "@/resources/gql/location.gql";

type LocationFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: LocationEntity | null;
};

const defaultValues: LocationFormValues = {
  name: "",
  type: "OUTLET",
};

export function LocationFormSheet({
  open,
  onOpenChange,
  location,
}: LocationFormSheetProps) {
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const isEdit = Boolean(location);
  const isSubmitting = createLocation.isPending || updateLocation.isPending;
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      location
        ? {
            name: location.name,
            type: location.type,
          }
        : defaultValues,
    );
  }, [form, location, open]);

  async function handleSubmit(values: LocationFormValues) {
    const locationType = values.type as LocationType;

    try {
      if (location) {
        await updateLocation.mutateAsync({
          id: location.id,
          name: values.name.trim(),
          type: locationType,
        });
        toast.success("Location updated");
      } else {
        await createLocation.mutateAsync({
          name: values.name.trim(),
          type: locationType,
        });
        toast.success("Location created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEdit ? "Failed to update location" : "Failed to create location",
        {
          description: ErrorHelper.parse(error).message,
        },
      );
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit location" : "Create location"}</SheetTitle>
          <SheetDescription>
            Locations represent outlets, stores, or warehouses used for stock.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="location-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location name</FormLabel>
                  <FormControl>
                    <Input placeholder="Example: Main Outlet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OUTLET">Outlet</SelectItem>
                      <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="location-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create location"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
