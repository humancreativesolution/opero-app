import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { BarChart3, Boxes, PackageSearch, ShieldCheck } from "lucide-react";

const capabilities = [
  {
    title: "POS cepat",
    description: "Workflow kasir ringkas untuk scan, cart, dan checkout.",
    icon: ShieldCheck,
  },
  {
    title: "Purchasing",
    description: "Supplier, pembelian, stock-in, dan update HPP.",
    icon: PackageSearch,
  },
  {
    title: "Inventory ledger",
    description: "Stok berasal dari transaksi, bukan input manual terpisah.",
    icon: Boxes,
  },
  {
    title: "Reporting",
    description: "Data sales, purchase, dan inventory siap dianalisis.",
    icon: BarChart3,
  },
];

function getTenantHost() {
  if (typeof window === "undefined") {
    return "tenant.opero.id";
  }

  return window.location.hostname;
}

export function LoginPage() {
  const tenantHost = getTenantHost();

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(203,164,71,0.20),transparent_32rem),linear-gradient(135deg,var(--background),var(--muted))]">
      <section className="flex min-h-screen items-center px-6 py-10 lg:px-10">
        <div className="mx-auto grid w-full max-w-7xl items-stretch gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex h-full flex-col justify-center gap-8">
            <div className="space-y-5">
              <Badge
                className="border-primary/30 bg-primary/10 text-foreground"
                variant="outline"
              >
                Human Creative Solution
              </Badge>
              <div className="max-w-2xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                  Opero untuk operasional retail yang rapi dan cepat.
                </h1>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.map((item) => (
                <Card
                  className="border-primary/10 bg-background/70 backdrop-blur"
                  key={item.title}
                >
                  <CardHeader>
                    <item.icon className="size-5 text-primary" />
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex h-full items-stretch justify-center">
            <Card className="flex w-full max-w-md flex-col justify-center border-primary/15 bg-background/90 shadow-2xl shadow-primary/10 backdrop-blur">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <span className="text-lg font-semibold">O</span>
                  </div>
                  <Badge variant="secondary">{tenantHost}</Badge>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">Masuk ke Opero</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <LoginForm />
                <Separator />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
