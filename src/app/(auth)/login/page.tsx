'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition, Suspense } from 'react';
import { Mountain } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { login, register } from '@/lib/actions/auth.actions';
import { LoginSchema, loginSchema } from '@/lib/validators';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [error, setError] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginSchema) => {
    setError('');
    startTransition(() => {
      login(values, redirectUrl).then((data) => {
        if (data?.error) {
          setError(data.error);
        }
      });
    });
  };

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
            <Mountain className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} type="email" disabled={isPending} />
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
                   <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                        Forgot your password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input placeholder="••••••••" {...field} type="password" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
