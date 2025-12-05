import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary">
        <main className="w-full max-w-md p-6">
            {children}
        </main>
    </div>
  );
}
