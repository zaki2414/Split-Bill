import { GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Wallet } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import JigsawBackground from "../components/JigsawBackground";

export default function LoginScreen({ onBack }) {
  const login = useAuthStore((s) => s.login);

  const googleLogin = useMutation({
    mutationFn: (credential) =>
      api.post("/api/auth/google", { credential }).then((res) => res.data),
    onSuccess: ({ token, user }) => login(token, user),
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4">
      <JigsawBackground opacity={0.1} />
      <div className="relative w-full max-w-sm rounded-3xl border-2 border-olive-light/60 bg-white p-8 text-center shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex cursor-pointer items-center gap-1 text-xs font-extrabold text-olive-dark/60 hover:text-olive-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Kembali ke Beranda
        </button>

        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/10">
          <Wallet className="h-7 w-7 text-olive" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-extrabold text-olive-darker">Masuk ke BagiRata</h1>
        <p className="mt-1.5 text-sm font-medium text-olive-dark/70">
          Masuk dengan akun Google untuk menyimpan dan mengakses riwayat split bill milik Anda sendiri.
        </p>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => googleLogin.mutate(credentialResponse.credential)}
            onError={() => googleLogin.reset()}
            theme="filled_black"
            shape="pill"
            text="signin_with"
          />
        </div>

        {googleLogin.isPending && (
          <p className="mt-4 text-xs font-bold text-olive-dark/60">Memverifikasi...</p>
        )}
        {googleLogin.isError && (
          <p className="mt-4 text-xs font-bold text-coral">Gagal masuk. Silakan coba lagi.</p>
        )}
      </div>
    </div>
  );
}
