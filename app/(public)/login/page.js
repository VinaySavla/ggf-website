"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { requestLoginCode } from "@/actions/auth.actions";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("password");
  const [codeSent, setCodeSent] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    code: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier: formData.identifier,
        ...(mode === "code" ? { code: formData.code } : { password: formData.password }),
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Login successful!");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!formData.identifier.trim()) return toast.error("Enter your email, mobile or member ID first");
    setIsLoading(true);
    const result = await requestLoginCode(formData.identifier);
    setIsLoading(false);
    if (result.error) return toast.error(result.error);
    setCodeSent(true);
    toast.success("If the account has an email, a sign-in code was sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your GGF account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-identifier" className="block text-sm font-medium text-gray-700 mb-2">
                Email, Mobile, or Member ID
              </label>
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({ ...formData, identifier: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your email, mobile, or member ID"
                required
              />
            </div>

            <div>
              <label htmlFor="login-secret" className="block text-sm font-medium text-gray-700 mb-2">
                {mode === "password" ? "Password" : "One-time sign-in code"}
              </label>
              <div className="relative">
                <input
                  id="login-secret"
                  name={mode === "password" ? "password" : "code"}
                  type={mode === "password" ? (showPassword ? "text" : "password") : "text"}
                  inputMode={mode === "code" ? "numeric" : undefined}
                  maxLength={mode === "code" ? 6 : undefined}
                  value={mode === "password" ? formData.password : formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, [mode === "password" ? "password" : "code"]: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                  placeholder={mode === "password" ? "Enter your password" : "Enter the 6-digit code"}
                  required
                />
                {mode === "password" && <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>}
              </div>
              {mode === "code" && <button type="button" onClick={handleSendCode} disabled={isLoading} className="text-sm text-primary mt-2">{codeSent ? "Resend code" : "Email me a sign-in code"}</button>}
            </div>

            <button type="button" onClick={() => { setMode(mode === "password" ? "code" : "password"); setCodeSent(false); }} className="w-full text-sm text-primary">
              {mode === "password" ? "Sign in with an email code" : "Sign in with password"}
            </button>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary-600"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:text-primary-600 font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
