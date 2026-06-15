import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import brandLogo from "../../assets/Logo/Logo3.png";
import { useAuth } from "../model/AuthContext";
import { PATHS } from "../../app/router/paths";
import { isValidEmail, normalizeEmail, passwordPolicyText } from "../lib/validation";
import { env } from "../../shared/config/env";


const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

/* ─── Logo ───────────────────────────────────────────────────── */
const Logo = ({ dark = false }) => (
  <Link to="/" className="inline-flex items-center" aria-label="LurnStack home">
    <img
      src={brandLogo}
      alt="LurnStack"
      className={dark ? "h-14 w-auto object-contain" : "h-16 w-auto object-contain"}
      loading="eager"
    />
  </Link>
);

/* ─── Global Styles ──────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim-1 { animation: fade-in-up 0.3s ease-out both; }
    .anim-2 { animation: fade-in-up 0.3s ease-out 0.05s both; }
    .anim-3 { animation: fade-in-up 0.3s ease-out 0.1s both; }
    
    html, body, #root { min-height: 100%; margin: 0; padding: 0; overflow-x: hidden; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .auth-shell {
      position: relative;
      isolation: isolate;
      background:
        radial-gradient(circle at 16% 10%, rgba(84, 212, 16, 0.24), transparent 28%),
        radial-gradient(circle at 90% 18%, rgba(0, 77, 61, 0.13), transparent 34%),
        linear-gradient(135deg, #f7fff3 0%, #ffffff 46%, #f2fbf6 100%);
    }
    .auth-shell::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(0, 77, 61, 0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 77, 61, 0.045) 1px, transparent 1px);
      background-size: 46px 46px;
      mask-image: linear-gradient(to bottom, rgba(0,0,0,0.78), transparent 78%);
    }
    .auth-card {
      position: relative;
      border: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 24px 64px rgba(15, 23, 42, 0.12);
      backdrop-filter: blur(14px);
    }
    .auth-card::before {
      content: none;
    }
    .auth-content { position: relative; z-index: 1; }
    .auth-mark { box-shadow: 0 18px 38px rgba(84, 212, 16, 0.2); }
  `}</style>
);

export default function LoginPage() {
  const { signIn, signInWithToken, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [externalAuthLoading, setExternalAuthLoading] = useState(false);
  const [externalAuthError, setExternalAuthError] = useState("");

  const externalToken = searchParams.get("token") || "";
  const externalError = searchParams.get("error") || "";

  const redirectTo = (() => {
    const from = location?.state?.from;
    const redirect = searchParams.get("redirect");
    const target =
      typeof from === "string" && from.trim()
        ? from
        : typeof redirect === "string" && redirect.trim()
          ? redirect
          : "";
    if (target && target !== PATHS.TRAINER_DASHBOARD && target !== PATHS.LOGIN) return target;
    return PATHS.TRAINER_DASHBOARD;
  })();

  const googleRedirectTo = redirectTo === PATHS.LOGIN ? PATHS.TRAINER_DASHBOARD : redirectTo;

  useEffect(() => {
    if (!externalToken && !externalError) return undefined;
    if (externalError) {
      setExternalAuthError(decodeURIComponent(externalError));
      window.history.replaceState({}, document.title, window.location.pathname);
      return undefined;
    }
    if (isAuthenticated) return undefined;
    let active = true;

    const completeGoogleLogin = async () => {
      setExternalAuthError("");
      setExternalAuthLoading(true);
      try {
        await signInWithToken({ token: externalToken, remember: true });
        if (active) {
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate(googleRedirectTo, { replace: true });
        }
      } catch (err) {
        if (active) {
          setExternalAuthError(err?.message || "Unable to sign in with Google.");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } finally {
        if (active) {
          setExternalAuthLoading(false);
        }
      }
    };

    completeGoogleLogin();

    return () => {
      active = false;
    };
  }, [externalError, externalToken, googleRedirectTo, isAuthenticated, navigate, signInWithToken]);

  if (isAuthenticated) {
    return (
      <Navigate
        to={userRole === "trainer" ? (externalToken ? googleRedirectTo : redirectTo) : PATHS.LOGIN}
        replace
      />
    );
  }

  const validate = () => {
    const errs = {};
    const email = normalizeEmail(form.email);
    if (!email) errs.email = "Email is required";
    else if (!isValidEmail(email)) errs.email = "Enter a valid email address (example: name@gmail.com)";

    if (!form.password) errs.password = "Password is required";
    else if (String(form.password).length < 8) errs.password = "Password must be at least 8 characters";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await signIn({
        email: normalizeEmail(form.email),
        password: form.password,
        remember: form.remember,
        role: "trainer",
      });
      navigate(PATHS.TRAINER_DASHBOARD, {
        replace: true,
      });
    } catch (err) {
      setFormError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (typeof window === "undefined") return;
    setFormError("");
    setExternalAuthError("");
    setSocialLoading(true);

    const loginUrl = new URL(PATHS.LOGIN, window.location.origin);
    loginUrl.searchParams.set("role", "trainer");
    if (redirectTo && redirectTo !== PATHS.TRAINER_DASHBOARD) {
      loginUrl.searchParams.set("redirect", redirectTo);
    }
    const configuredBaseUrl = String(env.apiBaseUrl || "").replace(/\/+$/, "");
    const baseUrl = configuredBaseUrl || "https://api.lurnstack.com";
    const redirectToLogin = loginUrl.toString();
    const authUrl = `${baseUrl}/api/auth/google?redirect=${encodeURIComponent(redirectToLogin)}`;

    window.location.assign(authUrl);
  };

  return (
    <>
      <GlobalStyles />
      <div className="auth-shell flex min-h-dvh w-full">

        {/* ── LEFT PANEL (Desktop Only) ── */}
        <div className="hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f2d1f]/95 via-[#0f2d1f]/85 to-transparent" />
          </div>
          <div className="absolute top-10 left-12 z-10"><Logo /></div>
        </div>

        {/* ── RIGHT PANEL (Mobile Friendly) ── */}
        <div className="flex min-h-0 flex-1 flex-col bg-transparent">
          <div className="relative z-10 flex min-h-dvh flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
            <div className="auth-card w-full max-w-[480px] mx-auto rounded-[28px] p-5 sm:p-7">
              <div className="auth-content">
              {externalAuthLoading ? (
                <div className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-5 shadow-sm mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-[#004d3d]/20 border-t-[#004d3d] rounded-full animate-spin" />
                    <p className="text-[12px] font-semibold text-slate-600">
                      Completing Google sign-in...
                    </p>
                  </div>
                </div>
              ) : null}
              {externalAuthError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
                  {externalAuthError}
                </div>
              ) : null}
              <div className="flex justify-center mb-5">
                <div className="auth-mark rounded-full bg-white p-2 ring-1 ring-[#004d3d]/10">
                  <Logo dark />
                </div>
              </div>
              
              <div className="anim-1 mb-5 text-center">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#54d410]">LurnStack Sign In</p>
                <h1 className="text-2xl lg:text-3xl font-black text-[#004d3d] mb-1">Sign In</h1>
                <p className="text-slate-500 text-[12px] font-semibold leading-relaxed">Please enter your details to continue.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-3.5 anim-3">
                {formError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
                    {formError}
                  </div>
                ) : null}
                <div>
                  <label htmlFor="email" className="block text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 ml-1">Email Address</label>
                  <input
                    id="email" type="email" name="email" placeholder="Enter email address"
                    value={form.email} onChange={handleChange}
                    className={`w-full h-11 px-4 rounded-xl bg-slate-50 border text-[13px] outline-none transition-all
                      ${errors.email ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"}`}
                  />
                  {errors.email ? (
                    <div className="mt-1 ml-1 text-[10px] font-semibold text-red-600">
                      {errors.email}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="password" className="block text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 ml-1">Password</label>
                  <div className="relative">
                    <input
                      id="password" type={showPassword ? "text" : "password"} name="password" placeholder="Enter password"
                      value={form.password} onChange={handleChange}
                      className={`w-full h-11 px-4 pr-12 rounded-xl bg-slate-50 border text-[13px] outline-none transition-all
                        ${errors.password ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"}`}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 px-4 text-slate-400"><EyeIcon open={showPassword} /></button>
                  </div>
                  {errors.password ? (
                    <div className="mt-1 ml-1 text-[10px] font-semibold text-red-600">
                      {errors.password}
                    </div>
                  ) : (
                    <div className="mt-1 ml-1 text-[10px] text-slate-500">
                      {passwordPolicyText()}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} className="w-3.5 h-3.5 rounded border-slate-300 text-[#004d3d] focus:ring-[#004d3d]/20" />
                    <span className="text-[11px] text-slate-600 font-medium">Remember me</span>
                  </label>
                  <Link to="/forgot-password" title="Forgot password?" className="text-[11px] font-bold text-[#004d3d] hover:underline">Forgot password?</Link>
                </div>

                <button type="submit" disabled={loading || externalAuthLoading}
                  className="w-full h-11 rounded-xl bg-[#004d3d] hover:bg-[#00392d] active:scale-[0.98] text-white font-bold text-[13px] transition-all shadow-[0_16px_36px_rgba(0,77,61,0.22)] flex items-center justify-center gap-2 mt-1">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign In"}
                </button>
              </form>

              <div className="relative mt-2 mb-2 anim-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center"><span className="px-4 bg-white text-slate-400 text-[8px] uppercase tracking-[0.2em] font-bold">OR CONTINUE WITH</span></div>
              </div>

              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 anim-3">
                <button
                  type="button"
                  disabled={loading || socialLoading || externalAuthLoading}
                  onClick={handleGoogleLogin}
                  className="h-9 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-[11px] font-bold transition-all shadow-sm"
                >
                  <GoogleIcon />
                  <span>{socialLoading ? "Opening..." : "Google"}</span>
                </button>
                <button
                  type="button"
                  disabled={loading || socialLoading || externalAuthLoading}
                  className="h-9 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-[11px] font-bold transition-all shadow-sm"
                >
                  <FacebookIcon />
                  <span>Facebook</span>
                </button>
              </div>

              <p className="mt-5 text-center text-[12px] text-slate-500">
                New to LurnStack?{" "}
                <Link
                  to="/signup"
                  className="font-black text-[#004d3d] hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </p>

              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
