'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Download, Trash2, Upload } from "lucide-react";
import { uploadAttachment, deleteAttachment } from "@/lib/actions/attachment.actions";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function AttachmentsSection({ issueId, attachments, onUpdate }: { issueId: string; attachments: any[]; onUpdate: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple client-side upload (in production, use proper file storage like S3/Vercel Blob)
    setIsUploading(true);
    
    try {
      // For demo, we'll create a data URL (in production, upload to cloud storage)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileUrl = reader.result as string;
        
        await uploadAttachment({
          issueId,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          fileType: file.type,
        });
        
        onUpdate();
        toast({ title: "File uploaded successfully" });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleDelete = (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return;

    startTransition(async () => {
      try {
        await deleteAttachment(attachmentId);
        onUpdate();
        toast({ title: "Attachment deleted" });
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Attachments</h2>
          {attachments.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {attachments.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" disabled={isUploading} asChild>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-1" />
            {isUploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </Button>
      </div>

      <div className="space-y-2">
        {attachments.map((attachment: any) => (
          <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 group">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)} • Uploaded by {attachment.uploader.name} • {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a href={attachment.url} download={attachment.name}>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDelete(attachment.id)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {attachments.length === 0 && (
          <p className="text-sm text-muted-foreground">No attachments</p>
        )}
      </div>
    </div>
  );
}
