import React, { useMemo, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { app } from "@/firebase";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GenerateCodeResult = { code?: string; expiry?: string; message?: string };

export function AdminPage() {
  const { currentUser } = useAuth();
  const [days, setDays] = useState(365);
  const [secretCode, setSecretCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const CORRECT_SECRET_CODE = "HUYADMIN2026";

  const functions = useMemo(() => getFunctions(app), []);
  const generateCodeFunction = useMemo(
    () => httpsCallable<{ days: number; secretCode: string; manualCode?: string }, GenerateCodeResult>(functions, "generateAccessCode"),
    [functions],
  );

  const handleGenerate = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập trước.");
      return;
    }
    if (secretCode !== CORRECT_SECRET_CODE) {
      toast.error("Mã bí mật Admin không chính xác.");
      return;
    }
    if (manualCode && manualCode.length < 5) {
      toast.error("Mã code thủ công phải dài ít nhất 5 ký tự.");
      return;
    }

    setIsLoading(true);
    setNewCode(null);
    setExpiryDate(null);

    try {
      const result = await generateCodeFunction({
        days,
        secretCode,
        manualCode: manualCode ? manualCode.toUpperCase() : undefined,
      });

      if (result.data?.code) {
        setNewCode(result.data.code);
        setExpiryDate(result.data.expiry ?? null);
        setSecretCode("");
        setManualCode("");
        toast.success("Đã tạo mã kích hoạt");
      } else {
        toast.error(result.data?.message || "Không thể tạo code.");
      }
    } catch (err) {
      console.error("Cloud Function error:", err);
      toast.error("Lỗi kết nối Cloud Function. Kiểm tra deploy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Admin</CardTitle>
          <CardDescription>Tạo mã kích hoạt mới.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Mã bí mật Admin</Label>
            <Input type="password" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} placeholder="Nhập mã bí mật" />
          </div>

          <div className="grid gap-1.5">
            <Label>Mã code thủ công (tùy chọn)</Label>
            <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Để trống để tạo ngẫu nhiên" />
          </div>

          <div className="grid gap-1.5">
            <Label>Số ngày kích hoạt</Label>
            <Input
              type="number"
              value={days}
              min={1}
              onChange={(e) => setDays(Number(e.target.value || 1))}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isLoading || days < 1 || !secretCode}>
            {isLoading ? "Đang tạo..." : "Tạo mã"}
          </Button>

          {newCode ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_80%,var(--color-bg))] p-3">
              <p className="text-xs text-[var(--color-text-secondary)]">Mã kích hoạt</p>
              <p className="mt-1 select-all text-lg font-semibold tracking-wide">{newCode}</p>
              {expiryDate ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Hạn: {expiryDate}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}


