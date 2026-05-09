import { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Auth<span className="text-primary">Integrate</span></h1>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative">{children}</main>

    </div>
  );
}
