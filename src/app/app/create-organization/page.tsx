'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { createOrganization } from "@/lib/actions/org.actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const orgSchema = z.object({
    name: z.string().min(2, "Organization name must be at least 2 characters long"),
});

export default function CreateOrganizationPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof orgSchema>>({
        resolver: zodResolver(orgSchema),
        defaultValues: { name: "" },
    });

    const onSubmit = (values: z.infer<typeof orgSchema>) => {
        startTransition(async () => {
            try {
                const newOrg = await createOrganization(values.name);
                toast({ title: "Organization created" });
                router.push(`/app/${newOrg.slug}`);
            } catch (error) {
                toast({
                    title: "Failed to create organization",
                    description: (error as Error).message,
                    variant: "destructive"
                });
            }
        });
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                <CardTitle>Create Organization</CardTitle>
                <CardDescription>Create a new organization to start managing your projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organization Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Acme Inc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isPending} className="w-full">
                                {isPending ? "Creating..." : "Create Organization"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
