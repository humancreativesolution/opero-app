import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Halaman tidak ditemukan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Route yang Anda buka belum tersedia di Opero App.
          </p>
          <Button asChild>
            <Link to="/login">Kembali ke login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
