import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function CreateOrganizationPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                <CardTitle>Create Organization</CardTitle>
                <CardDescription>Create a new organization to start managing your projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Organization creation form will be here.</p>
                </CardContent>
            </Card>
        </div>
    )
  }
  