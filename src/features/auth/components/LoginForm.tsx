import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";
import { ErrorHelper } from "@/libs/error";
import { useLogin } from "@/resources/gql/auth.gql";

export function LoginForm() {
  const isDevelopment = import.meta.env.DEV;
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      subdomain: "",
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(values: LoginFormValues) {
    try {
      await login.mutateAsync({
        email: values.email,
        password: values.password,
        subdomain:
          isDevelopment && values.subdomain ? values.subdomain : undefined,
      });

      const redirectTo =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/dashboard";

      toast.success("Login berhasil");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error("Login gagal", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-5" onSubmit={form.handleSubmit(handleSubmit)}>
        {isDevelopment && (
          <FormField
            control={form.control}
            name="subdomain"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>Subdomain</FormLabel>
                  <span className="text-xs text-muted-foreground">
                    Opsional dev
                  </span>
                </div>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <Building2 className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      autoComplete="off"
                      placeholder="tokomaju"
                      {...field}
                    />
                    <InputGroupAddon>.opero.id</InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <Mail className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoComplete="email"
                    inputMode="email"
                    placeholder="email@tokomaju.com"
                    type="email"
                    {...field}
                  />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-3">
                <FormLabel>Password</FormLabel>
                <Button className="h-auto px-0" type="button" variant="link">
                  Lupa password?
                </Button>
              </div>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <LockKeyhole className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    type={showPassword ? "text" : "password"}
                    {...field}
                  />
                  <InputGroupButton
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                    onClick={() => setShowPassword((current) => !current)}
                    size="icon-xs"
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </InputGroupButton>
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="h-10 w-full" disabled={isSubmitting || login.isPending} type="submit">
          {isSubmitting || login.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses
            </>
          ) : (
            "Masuk ke Opero"
          )}
        </Button>

        <Input className="sr-only" readOnly tabIndex={-1} value="tenant-by-host" />
      </form>
    </Form>
  );
}
