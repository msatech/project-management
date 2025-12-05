import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mountain } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
          <Mountain className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg font-headline">Altitude</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link
              href="/login"
              className="text-sm font-medium"
              prefetch={false}
            >
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/register" prefetch={false}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
                  Reach New Heights in Project Management
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Altitude is the modern, sleek, and powerful platform for tracking your projects from conception to
                  completion.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/register" prefetch={false}>
                    Get Started For Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Altitude. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
