'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { createProject } from '@/lib/actions/project.actions';
import { ProjectType } from '@prisma/client';
import { KanbanSquare, BookCopy } from 'lucide-react';

const createProjectSchema = z.object({
  name: z.string().min(2, { message: 'Project name must be at least 2 characters.' }),
  type: z.nativeEnum(ProjectType, {
    required_error: 'You need to select a project type.',
  }),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export function CreateProjectForm({ organization }: { organization: { id: string, name: string } }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      type: ProjectType.KANBAN,
    },
  });

  const onSubmit = (values: CreateProjectFormValues) => {
    startTransition(async () => {
      try {
        const newProject = await createProject({
          ...values,
          organizationId: organization.id,
        });
        toast({ title: 'Project created successfully!' });
        router.push(`/app/${newProject.organization.slug}/${newProject.key}`);
      } catch (error) {
        toast({
          title: 'Error creating project',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-2xl">Create your first project</CardTitle>
                <CardDescription>
                    Welcome to {organization.name}! Create a project to start collaborating with your team.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Mobile App Redesign" {...field} disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Project Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                        disabled={isPending}
                                    >
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value={ProjectType.KANBAN} id="kanban" className="sr-only" />
                                            </FormControl>
                                            <Label htmlFor="kanban" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                                <KanbanSquare className="mb-3 h-6 w-6" />
                                                Kanban
                                            </Label>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                                 <RadioGroupItem value={ProjectType.SCRUM} id="scrum" className="sr-only" />
                                            </FormControl>
                                            <Label htmlFor="scrum" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                                <BookCopy className="mb-3 h-6 w-6" />
                                                Scrum
                                            </Label>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Creating Project...' : 'Create Project'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
