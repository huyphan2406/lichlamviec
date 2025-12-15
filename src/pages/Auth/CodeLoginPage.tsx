import React, { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { toast } from "sonner";
import { auth, db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CodeDoc = {
  expiryDate: string;
  activeUID?: string;
};

export function CodeLoginPage() {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const inputCode = accessCode.trim().toUpperCase();
        if (!inputCode) {
          setError("Vui lòng nhập Mã Kích Hoạt.");
          return;
        }

        const codeRef = doc(db, "code", inputCode);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
          setError("Mã truy cập không hợp lệ. Vui lòng kiểm tra lại.");
          return;
        }

        const data = codeSnap.data() as CodeDoc;
        const now = new Date();
        const expiryDate = new Date(data.expiryDate);

        if (data.activeUID && data.activeUID.length > 1) {
          setError("Mã này đang được sử dụng trên thiết bị khác. Vui lòng đăng xuất thiết bị đó trước.");
          return;
        }

        if (now > expiryDate) {
          setError(`Mã đã hết hạn (${data.expiryDate}).`);
          return;
        }

        const userCredential = await signInAnonymously(auth);
        const newUID = userCredential.user.uid;

        await updateDoc(codeRef, {
          activeUID: newUID,
          lastUsedDate: now.toISOString(),
        });

        toast.success("Đăng nhập thành công");
        navigate(from, { replace: true });
      } catch (err: unknown) {
        console.error("Firebase error:", err);
        const code =
          err && typeof err === "object" && "code" in err ? (err as { code?: unknown }).code : undefined;
        if (code === "permission-denied") {
          setError("Lỗi quyền truy cập Database. Kiểm tra Firestore Security Rules.");
        } else {
          setError("Có lỗi hệ thống xảy ra, không thể xác thực mã.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [accessCode, navigate, from],
  );

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Truy cập ứng dụng</CardTitle>
          <CardDescription>Nhập mã kích hoạt để đăng nhập.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="code">Mã kích hoạt</Label>
              <Input
                id="code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="VD: ABCDE123"
                autoCapitalize="characters"
                disabled={isLoading}
              />
              {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xác thực..." : "Đăng nhập"}
            </Button>

            <div className="text-sm text-[var(--color-text-secondary)]">
              Cần mua mã kích hoạt? <Link className="text-[var(--color-brand)] hover:underline" to="/contact">Liên hệ</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


