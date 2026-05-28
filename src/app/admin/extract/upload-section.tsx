"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ExtractedReview } from "@/lib/claude";

type FileStatus = "pending" | "analyzing" | "success" | "error";

type FileEntry = {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export function UploadSection({
  onExtractedReviews,
}: {
  onExtractedReviews: (reviews: ExtractedReview[]) => void;
}) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid: File[] = [];
    for (const f of arr) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: JPEG/PNG/WebP만 지원합니다`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: 10MB 이하만 가능합니다`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;
    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: `${Date.now()}-${f.name}-${Math.random()}`,
        file: f,
        status: "pending" as FileStatus,
      })),
    ]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0 || analyzing) return;
    setAnalyzing(true);
    const allReviews: ExtractedReview[] = [];

    // 현재 시점 스냅샷으로 순회 — success는 스킵, pending/error는 재시도
    for (const entry of files) {
      if (entry.status === "success") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id
            ? { ...f, status: "analyzing", error: undefined }
            : f,
        ),
      );

      try {
        const fd = new FormData();
        fd.append("image", entry.file);
        const res = await fetch("/api/admin/extract-reviews", {
          method: "POST",
          body: fd,
        });
        const data: {
          reviews?: ExtractedReview[];
          error?: string;
        } = await res.json().catch(() => ({}));
        if (!res.ok || !data.reviews) {
          throw new Error(data.error ?? "분석 실패");
        }
        allReviews.push(...data.reviews);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, status: "success" } : f,
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "error", error: msg }
              : f,
          ),
        );
      }
    }

    setAnalyzing(false);
    if (allReviews.length > 0) {
      onExtractedReviews(allReviews);
    } else {
      toast.warning("추출된 후기가 없습니다");
    }
  };

  const successCount = files.filter((f) => f.status === "success").length;
  const pendingCount = files.filter(
    (f) => f.status === "pending" || f.status === "error",
  ).length;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging
            ? "border-brand bg-brand-50"
            : "border-muted-foreground/30 hover:border-brand-400 hover:bg-muted/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          캡쳐 이미지를 끌어다 놓거나 클릭해서 선택
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG · PNG · WebP · 최대 10MB · 여러 장 가능
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              선택된 파일 {files.length}장
              {successCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  · 완료 {successCount}
                </span>
              )}
            </p>
            {!analyzing && (
              <button
                type="button"
                onClick={() => setFiles([])}
                className="text-xs text-muted-foreground hover:text-red-600"
              >
                모두 제거
              </button>
            )}
          </div>
          {files.map((entry) => (
            <FileItem
              key={entry.id}
              entry={entry}
              onRemove={() => removeFile(entry.id)}
              disabled={analyzing}
            />
          ))}
        </div>
      )}

      {files.length > 0 && (
        <Button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={analyzing || pendingCount === 0}
          className="w-full bg-brand text-white hover:bg-brand-700"
          size="lg"
        >
          {analyzing
            ? `분석 중... (${successCount}/${files.length})`
            : pendingCount === 0
              ? "모두 완료됨"
              : `${pendingCount}장 분석 시작`}
        </Button>
      )}
    </div>
  );
}

function FileItem({
  entry,
  onRemove,
  disabled,
}: {
  entry: FileEntry;
  onRemove: () => void;
  disabled: boolean;
}) {
  // useMemo + useEffect cleanup — render 중 setState 호출 회피
  const thumbnail = useMemo(
    () => URL.createObjectURL(entry.file),
    [entry.file],
  );
  useEffect(() => () => URL.revokeObjectURL(thumbnail), [thumbnail]);

  return (
    <Card className="flex items-center gap-3 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt=""
        className="h-12 w-12 shrink-0 rounded border object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{entry.file.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {(entry.file.size / 1024 / 1024).toFixed(1)} MB
          </span>
          <StatusBadge status={entry.status} />
        </div>
        {entry.status === "error" && entry.error && (
          <p className="mt-1 break-words text-xs text-red-600">
            {entry.error}
          </p>
        )}
      </div>
      {entry.status !== "analyzing" && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-600 disabled:opacity-50"
          aria-label="제거"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: FileStatus }) {
  switch (status) {
    case "pending":
      return <span className="text-xs text-muted-foreground">대기</span>;
    case "analyzing":
      return <span className="text-xs text-brand-700">분석 중...</span>;
    case "success":
      return <span className="text-xs text-green-600">✓ 완료</span>;
    case "error":
      return <span className="text-xs text-red-600">⚠ 실패</span>;
  }
}
