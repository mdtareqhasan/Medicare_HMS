import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/api/axiosInstance";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axiosInstance.post("/api/v1/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.url;
      toast.toast({ title: "Upload successful", description: url });
    } catch (err: any) {
      toast.toast({
        title: "Upload failed",
        description: err?.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="file"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
      />
      <Button disabled={loading || !file} onClick={handleUpload}>
        {loading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
