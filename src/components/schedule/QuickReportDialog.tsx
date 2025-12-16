import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Job } from "@/features/schedule/types";
import { combineNames, combineLocation } from "@/features/schedule/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
};

function revokeBlobUrl(url: string | null) {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function QuickReportDialog({ open, onOpenChange, job }: Props) {
  const [email, setEmail] = useState("");
  const [gmv, setGmv] = useState("");
  const [startTimeActual, setStartTimeActual] = useState("");
  const [liveIds, setLiveIds] = useState<string[]>([""]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Memoize computed values to avoid recalculation on every render
  const keyLivestream = useMemo(() => {
    if (!job) return "";
    const date = (job["Date livestream"] || "").replaceAll("/", "");
    const store = (job.Store || "").replace(/\s+/g, "").substring(0, 10);
    const time = (job["Time slot"] || "").split(" - ")[0].replaceAll(":", "");
    return `${date}_${store}_${time}`.toUpperCase();
  }, [job]);

  const title = useMemo(() => job?.Store || "Điền report", [job?.Store]);
  const subtitle = useMemo(() => {
    if (!job) return "";
    return `${job["Date livestream"] || "N/A"} • ${job["Time slot"] || "N/A"} • ${combineLocation(job)}`;
  }, [job]);
  const people = useMemo(() => {
    if (!job) return "";
    return `${combineNames(job["Talent 1"], job["Talent 2"])} • ${combineNames(job["Coordinator 1"], job["Coordinator 2"])}`;
  }, [job]);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setGmv("");
    setStartTimeActual("");
    setLiveIds([""]);
    setImagePreview((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
    setIsSubmitting(false);
  }, [open, job]);

  useEffect(() => {
    return () => {
      setImagePreview((prev) => {
        revokeBlobUrl(prev);
        return null;
      });
    };
  }, []);

  const onPickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB.");
      e.target.value = "";
      return;
    }
    // Use requestAnimationFrame to prevent blocking UI
    requestAnimationFrame(() => {
      const url = URL.createObjectURL(file);
      setImagePreview((prev) => {
        revokeBlobUrl(prev);
        return url;
      });
      e.target.value = "";
      toast.message("Ảnh đã tải lên", { description: "Bạn có thể nhập thông tin thủ công từ ảnh." });
    });
  }, []);

  const addLiveId = useCallback(() => setLiveIds((p) => [...p, ""]), []);
  const removeLiveId = useCallback((idx: number) => setLiveIds((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx))), []);
  const updateLiveId = useCallback((idx: number, value: string) => setLiveIds((p) => p.map((v, i) => (i === idx ? value : v))), []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!job) return;

      const validLiveIds = liveIds.map((s) => s.trim()).filter(Boolean);
      const idLive1 = validLiveIds[0] || "";
      const idLive2 = validLiveIds.slice(1).join(", ");

      if (!email.trim()) {
        toast.error("Vui lòng nhập email.");
        return;
      }
      if (!idLive1) {
        toast.error("Vui lòng nhập ID phiên live 1.");
        return;
      }

      setIsSubmitting(true);
      try {
        const formUrl =
          "https://docs.google.com/forms/d/e/1FAIpQLSeZAOqU-pF3DEa7PB_GL4xzWg5K1lhIqy0m2LuUnDf_HV4_QA/formResponse";

        const formData = new FormData();
        // NOTE: these entry IDs are placeholders from the legacy project.
        formData.append("entry.123456789", email.trim());
        formData.append("entry.987654321", keyLivestream);
        formData.append("entry.111111111", idLive1);
        if (idLive2) formData.append("entry.222222222", idLive2);
        if (gmv.trim()) formData.append("entry.333333333", gmv.trim());
        if (startTimeActual.trim()) formData.append("entry.444444444", startTimeActual.trim());

        await fetch(formUrl, { method: "POST", mode: "no-cors", body: formData });
        toast.success("Đã gửi report");
        onOpenChange(false);
      } catch (err) {
        console.error("Submit Error:", err);
        toast.error("Lỗi khi gửi form. Vui lòng thử lại.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, gmv, startTimeActual, liveIds, keyLivestream, job, onOpenChange],
  );


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-2">
          <DialogTitle className="truncate text-base sm:text-lg">{title}</DialogTitle>
          <DialogDescription className="line-clamp-2 text-xs sm:text-sm">{subtitle}</DialogDescription>
        </DialogHeader>

        {job ? (
          <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <p className="truncate">{people}</p>
          </div>
        ) : null}

        <Separator />

        <form className="grid gap-3 sm:gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs sm:text-sm">Email *</Label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your.email@example.com" 
                type="email"
                className="h-9 sm:h-10 text-sm"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs sm:text-sm">Key livestream</Label>
              <Input 
                value={keyLivestream} 
                readOnly 
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-2">
            {liveIds.map((id, idx) => (
              <div key={idx} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs sm:text-sm">ID phiên live {idx === 0 ? "1 *" : idx + 1}</Label>
                  {idx > 0 ? (
                    <button
                      type="button"
                      onClick={() => removeLiveId(idx)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-1"
                    >
                      Xóa
                    </button>
                  ) : null}
                </div>
                <Input 
                  value={id} 
                  onChange={(e) => updateLiveId(idx, e.target.value)} 
                  placeholder={`Nhập ID phiên live ${idx + 1}`}
                  className="h-9 sm:h-10 text-sm"
                  autoComplete="off"
                />
              </div>
            ))}
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={addLiveId} className="h-8 sm:h-9 text-xs sm:text-sm">
                Thêm ID
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs sm:text-sm">GMV</Label>
              <Input 
                value={gmv} 
                onChange={(e) => setGmv(e.target.value)} 
                placeholder="Nhập GMV"
                className="h-9 sm:h-10 text-sm"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs sm:text-sm">Start time thực tế</Label>
              <Input 
                value={startTimeActual} 
                onChange={(e) => setStartTimeActual(e.target.value)} 
                placeholder="HH:MM"
                className="h-9 sm:h-10 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs sm:text-sm">Ảnh dashboard (tùy chọn)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPickImage}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              >
                Chọn ảnh
              </Button>
              {imagePreview ? <span className="text-xs text-[var(--color-text-secondary)]">Đã chọn</span> : null}
            </div>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-40 sm:max-h-56 w-full rounded-md border border-[var(--color-border)] object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !job}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


