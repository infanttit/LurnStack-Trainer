import { useState, useEffect, useRef } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import brandLogo from "../../assets/Logo/Logo3.png";
import { useAuth } from "../model/AuthContext";
import { sendOtpApi, verifyOtpApi } from "../api/authApi";
import { PATHS } from "../../app/router/paths";
import { isStrongPassword, isValidEmail, normalizeEmail, passwordPolicyText } from "../lib/validation";

/* ─── Icons ─────────────────────────────────────────────────── */
const EyeIcon = ({ open }) =>
  open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
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

    .modal-anim {
      animation: modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes modal-slide-up {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

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

const COUNTRY_CODES = [
  { name: "Afghanistan", code: "+93" },
  { name: "Albania", code: "+355" },
  { name: "Algeria", code: "+213" },
  { name: "Andorra", code: "+376" },
  { name: "Angola", code: "+244" },
  { name: "Argentina", code: "+54" },
  { name: "Armenia", code: "+374" },
  { name: "Australia", code: "+61" },
  { name: "Austria", code: "+43" },
  { name: "Azerbaijan", code: "+994" },
  { name: "Bahamas", code: "+1-242" },
  { name: "Bahrain", code: "+973" },
  { name: "Bangladesh", code: "+880" },
  { name: "Barbados", code: "+1-246" },
  { name: "Belarus", code: "+375" },
  { name: "Belgium", code: "+32" },
  { name: "Belize", code: "+501" },
  { name: "Benin", code: "+229" },
  { name: "Bhutan", code: "+975" },
  { name: "Bolivia", code: "+591" },
  { name: "Bosnia and Herzegovina", code: "+387" },
  { name: "Botswana", code: "+267" },
  { name: "Brazil", code: "+55" },
  { name: "Brunei", code: "+673" },
  { name: "Bulgaria", code: "+359" },
  { name: "Burkina Faso", code: "+226" },
  { name: "Burundi", code: "+257" },
  { name: "Cambodia", code: "+855" },
  { name: "Cameroon", code: "+237" },
  { name: "Canada", code: "+1" },
  { name: "Cape Verde", code: "+238" },
  { name: "Central African Republic", code: "+236" },
  { name: "Chad", code: "+235" },
  { name: "Chile", code: "+56" },
  { name: "China", code: "+86" },
  { name: "Colombia", code: "+57" },
  { name: "Comoros", code: "+269" },
  { name: "Congo", code: "+242" },
  { name: "Costa Rica", code: "+506" },
  { name: "Croatia", code: "+385" },
  { name: "Cuba", code: "+53" },
  { name: "Cyprus", code: "+357" },
  { name: "Czech Republic", code: "+420" },
  { name: "Democratic Republic of the Congo", code: "+243" },
  { name: "Denmark", code: "+45" },
  { name: "Djibouti", code: "+253" },
  { name: "Dominican Republic", code: "+1-809" },
  { name: "Ecuador", code: "+593" },
  { name: "Egypt", code: "+20" },
  { name: "El Salvador", code: "+503" },
  { name: "Estonia", code: "+372" },
  { name: "Ethiopia", code: "+251" },
  { name: "Fiji", code: "+679" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "Georgia", code: "+995" },
  { name: "Germany", code: "+49" },
  { name: "Ghana", code: "+233" },
  { name: "Greece", code: "+30" },
  { name: "Guatemala", code: "+502" },
  { name: "Guinea", code: "+224" },
  { name: "Guyana", code: "+592" },
  { name: "Haiti", code: "+509" },
  { name: "Honduras", code: "+504" },
  { name: "Hong Kong", code: "+852" },
  { name: "Hungary", code: "+36" },
  { name: "Iceland", code: "+354" },
  { name: "India", code: "+91" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Jamaica", code: "+1-876" },
  { name: "Japan", code: "+81" },
  { name: "Jordan", code: "+962" },
  { name: "Kazakhstan", code: "+7" },
  { name: "Kenya", code: "+254" },
  { name: "Kuwait", code: "+965" },
  { name: "Kyrgyzstan", code: "+996" },
  { name: "Laos", code: "+856" },
  { name: "Latvia", code: "+371" },
  { name: "Lebanon", code: "+961" },
  { name: "Liberia", code: "+231" },
  { name: "Libya", code: "+218" },
  { name: "Lithuania", code: "+370" },
  { name: "Luxembourg", code: "+352" },
  { name: "Malaysia", code: "+60" },
  { name: "Maldives", code: "+960" },
  { name: "Mali", code: "+223" },
  { name: "Malta", code: "+356" },
  { name: "Mauritius", code: "+230" },
  { name: "Mexico", code: "+52" },
  { name: "Moldova", code: "+373" },
  { name: "Monaco", code: "+377" },
  { name: "Mongolia", code: "+976" },
  { name: "Montenegro", code: "+382" },
  { name: "Morocco", code: "+212" },
  { name: "Mozambique", code: "+258" },
  { name: "Myanmar", code: "+95" },
  { name: "Namibia", code: "+264" },
  { name: "Nepal", code: "+977" },
  { name: "Netherlands", code: "+31" },
  { name: "New Zealand", code: "+64" },
  { name: "Nicaragua", code: "+505" },
  { name: "Niger", code: "+227" },
  { name: "Nigeria", code: "+234" },
  { name: "North Macedonia", code: "+389" },
  { name: "Norway", code: "+47" },
  { name: "Oman", code: "+968" },
  { name: "Pakistan", code: "+92" },
  { name: "Panama", code: "+507" },
  { name: "Papua New Guinea", code: "+675" },
  { name: "Paraguay", code: "+595" },
  { name: "Peru", code: "+51" },
  { name: "Philippines", code: "+63" },
  { name: "Poland", code: "+48" },
  { name: "Portugal", code: "+351" },
  { name: "Qatar", code: "+974" },
  { name: "Romania", code: "+40" },
  { name: "Russia", code: "+7" },
  { name: "Rwanda", code: "+250" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Senegal", code: "+221" },
  { name: "Serbia", code: "+381" },
  { name: "Seychelles", code: "+248" },
  { name: "Singapore", code: "+65" },
  { name: "Slovakia", code: "+421" },
  { name: "Slovenia", code: "+386" },
  { name: "South Africa", code: "+27" },
  { name: "South Korea", code: "+82" },
  { name: "Spain", code: "+34" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Sudan", code: "+249" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Taiwan", code: "+886" },
  { name: "Tanzania", code: "+255" },
  { name: "Thailand", code: "+66" },
  { name: "Tunisia", code: "+216" },
  { name: "Turkey", code: "+90" },
  { name: "Uganda", code: "+256" },
  { name: "Ukraine", code: "+380" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "Uruguay", code: "+598" },
  { name: "Uzbekistan", code: "+998" },
  { name: "Venezuela", code: "+58" },
  { name: "Vietnam", code: "+84" },
  { name: "Yemen", code: "+967" },
  { name: "Zambia", code: "+260" },
  { name: "Zimbabwe", code: "+263" },
];

const PHONE_LENGTH_BY_COUNTRY_CODE = {
  "+1": [10],
  "+1-242": [7],
  "+1-246": [7],
  "+1-809": [7],
  "+1-876": [7],
  "+7": [10],
  "+20": [10],
  "+27": [9],
  "+30": [10],
  "+31": [9],
  "+32": [8, 9],
  "+33": [9],
  "+34": [9],
  "+36": [9],
  "+39": [9, 10],
  "+40": [9],
  "+41": [9],
  "+43": [10, 11, 12, 13],
  "+44": [10],
  "+45": [8],
  "+46": [9, 10],
  "+47": [8],
  "+48": [9],
  "+49": [10, 11],
  "+51": [9],
  "+52": [10],
  "+53": [8],
  "+54": [10],
  "+55": [10, 11],
  "+56": [9],
  "+57": [10],
  "+58": [10],
  "+60": [9, 10],
  "+61": [9],
  "+62": [9, 10, 11, 12],
  "+63": [10],
  "+64": [8, 9, 10],
  "+65": [8],
  "+66": [9],
  "+81": [10],
  "+82": [9, 10],
  "+84": [9, 10],
  "+86": [11],
  "+90": [10],
  "+91": [10],
  "+92": [10],
  "+93": [9],
  "+94": [9],
  "+95": [8, 9, 10],
  "+98": [10],
  "+211": [9],
  "+212": [9],
  "+213": [9],
  "+216": [8],
  "+218": [9],
  "+220": [7],
  "+221": [9],
  "+223": [8],
  "+224": [9],
  "+226": [8],
  "+227": [8],
  "+229": [8],
  "+230": [8],
  "+231": [7, 8],
  "+233": [9],
  "+234": [10],
  "+235": [8],
  "+236": [8],
  "+237": [9],
  "+238": [7],
  "+244": [9],
  "+248": [7],
  "+249": [9],
  "+250": [9],
  "+251": [9],
  "+253": [8],
  "+254": [9],
  "+255": [9],
  "+256": [9],
  "+257": [8],
  "+258": [9],
  "+260": [9],
  "+263": [9],
  "+264": [9],
  "+267": [7, 8],
  "+269": [7],
  "+351": [9],
  "+352": [9],
  "+353": [9],
  "+354": [7],
  "+355": [9],
  "+356": [8],
  "+357": [8],
  "+358": [9, 10],
  "+359": [9],
  "+370": [8],
  "+371": [8],
  "+372": [7, 8],
  "+373": [8],
  "+374": [8],
  "+375": [9],
  "+376": [6],
  "+377": [8, 9],
  "+380": [9],
  "+381": [8, 9],
  "+382": [8],
  "+385": [8, 9],
  "+386": [8],
  "+387": [8],
  "+389": [8],
  "+420": [9],
  "+421": [9],
  "+501": [7],
  "+502": [8],
  "+503": [8],
  "+504": [8],
  "+505": [8],
  "+506": [8],
  "+507": [8],
  "+509": [8],
  "+591": [8],
  "+592": [7],
  "+593": [9],
  "+595": [9],
  "+598": [8],
  "+675": [8],
  "+679": [7],
  "+673": [7],
  "+855": [8, 9],
  "+856": [8, 9],
  "+880": [10],
  "+886": [9],
  "+960": [7],
  "+961": [7, 8],
  "+962": [9],
  "+964": [10],
  "+965": [8],
  "+966": [9],
  "+967": [9],
  "+968": [8],
  "+971": [9],
  "+972": [9],
  "+973": [8],
  "+974": [8],
  "+975": [8],
  "+976": [8],
  "+977": [10],
  "+994": [9],
  "+995": [9],
  "+996": [9],
  "+998": [9],
};

const blankOtpState = {
  sent: false,
  verified: false,
  identifier: "",
  expiresAt: "",
  secondsLeft: 0,
  cooldown: 0,
  attempts: 0,
  digits: ["", "", "", "", "", ""],
};

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function getPhoneValidationMessage(countryCode, rawPhoneNumber) {
  const digits = String(rawPhoneNumber || "").replace(/\D/g, "");
  if (!digits) return "Phone number is required";
  
  const countryDigits = String(countryCode || "").replace(/\D/g, "");
  const lengths = PHONE_LENGTH_BY_COUNTRY_CODE[countryCode] || [];

  if (countryDigits && digits.startsWith(countryDigits)) {
    const remainingDigits = digits.slice(countryDigits.length);
    if (lengths.length) {
      if (lengths.includes(remainingDigits.length) && !lengths.includes(digits.length)) {
        return "Enter only the phone number after the country code";
      }
    } else {
      const fullLengthValid = digits.length >= 7 && digits.length <= 15;
      const remainingLengthValid = remainingDigits.length >= 7 && remainingDigits.length <= 15;
      if (remainingLengthValid && !fullLengthValid) {
        return "Enter only the phone number after the country code";
      }
    }
  }

  if (lengths.length && !lengths.includes(digits.length)) {
    const formattedLengths = lengths.length === 1 ? lengths[0] : lengths.join(" or ");
    return `Enter a valid ${formattedLengths}-digit phone number`;
  }

  if (!lengths.length && (digits.length < 7 || digits.length > 15)) {
    return "Enter a valid phone number";
  }

  return "";
}

/* ─── Policy Modal (Terms or Privacy) ─────────────────────────── */
const PolicyModal = ({ type, onClose, onAccept }) => {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!type) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [type]);

  if (!type) return null;

  const isTerms = type === "terms";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden modal-anim">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-extrabold text-[#004d3d]">
              {isTerms ? "Terms of Service" : "Privacy Policy"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTerms ? "Please review our guidelines" : "How we handle your data"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-sm text-slate-600 leading-relaxed space-y-6 no-scrollbar">
          {isTerms ? (
            <>
              <section>
                <h3 className="font-bold text-slate-900 text-base mb-3">
                  1. Acceptance of Terms
                </h3>
                <p>
                  By creating an account on LurnStack, you agree to be bound by these
                  Terms of Service and all applicable laws and regulations.
                </p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 text-base mb-3">
                  2. User Account
                </h3>
                <p>
                  You agree to provide accurate, current, and complete information
                  during the registration process and to update such information as
                  needed.
                </p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 text-base mb-3">
                  3. Educational Content
                </h3>
                <p>
                  All courses and materials are for educational purposes only. We do
                  not guarantee specific outcomes through platform use alone.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-bold text-slate-900 text-base mb-3">
                  1. Data Collection
                </h3>
                <p>
                  We collect information you provide directly to us, such as when you
                  create an account, update your profile, or communicate with us.
                </p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 text-base mb-3">
                  2. How We Use Data
                </h3>
                <p>
                  We use the information we collect to provide, maintain, and improve
                  our services, and to personalize your learning experience.
                </p>
              </section>
              <section>
                <h3 className="font-bold text-slate-900 text-base mb-3">
                  3. Data Security
                </h3>
                <p>
                  We implement a variety of security measures to maintain the safety
                  of your personal information when you enter, submit, or access your
                  data.
                </p>
              </section>
            </>
          )}

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Document ID: {isTerms ? "LS-TOS-2026" : "LS-PP-2026"}
            </p>
            <p className="text-[10px] text-slate-400 italic">
              Last updated: May 07, 2026
            </p>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 transition-all order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="px-10 py-2.5 rounded-xl bg-[#004d3d] hover:bg-[#00392d] text-white text-sm font-bold shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.95] order-1 sm:order-2"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
};

function Toast({ message, onClose, tone = "warn" }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200]">
      <div className="toast-slide w-[320px] max-w-[calc(100vw-2rem)] bg-[#121212] text-white rounded-[12px] shadow-2xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {tone === "warn" ? (
              <div className="w-5 h-5 rounded-full bg-yellow-500/15 text-yellow-300 flex items-center justify-center text-[12px] font-black">
                !
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-[12px] font-black">
                ✓
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-widest font-bold text-white/70">
              {tone === "warn" ? "Warning" : "Success"}
            </div>
            <div className="mt-0.5 text-[12px] leading-snug text-white/95">
              {message}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close toast"
            className="shrink-0 w-8 h-8 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="h-1 bg-white/10">
          <div className={`toast-bar h-full ${tone === "warn" ? "bg-yellow-500" : "bg-emerald-500"}`} />
        </div>
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast-slide { animation: toast-in 0.25s ease-out both; }
        @keyframes toast-bar {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .toast-bar {
          transform-origin: left;
          animation: toast-bar 4s linear both;
        }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  const { signUp, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "+91",
    phoneNumber: "",
    password: "",
    agree: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null
  const [toastMessage, setToastMessage] = useState("");
  const [toastTone, setToastTone] = useState("warn");
  const [formError, setFormError] = useState("");
  const [emailOtp, setEmailOtp] = useState(blankOtpState);
  const emailOtpRefs = useRef([]);
  const ENABLE_EMAIL_OTP = true;

  useEffect(() => {
    if (!emailOtp.expiresAt) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(emailOtp.expiresAt).getTime() - Date.now()) / 1000));
      setEmailOtp((current) => ({ ...current, secondsLeft: remaining }));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [emailOtp.expiresAt]);

  useEffect(() => {
    if (emailOtp.cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setEmailOtp((current) => ({ ...current, cooldown: Math.max(0, current.cooldown - 1) }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [emailOtp.cooldown]);
  if (isAuthenticated) {
    return (
      <Navigate
        to={userRole === "trainer" ? PATHS.TRAINER_DASHBOARD : PATHS.LOGIN}
        replace
      />
    );
  }

  const handleAcceptPolicy = () => {
    setForm((p) => ({ ...p, agree: true }));
    setActiveModal(null);
  };

  const validate = () => {
    const errs = {};
    const fullName = String(form.fullName || "").trim();
    const email = normalizeEmail(form.email);

    if (!fullName) errs.fullName = "Full name is required";
    else if (fullName.length < 2) errs.fullName = "Enter your full name";

    if (!email) errs.email = "Email is required";
    else if (!isValidEmail(email)) errs.email = "Enter a valid email address (example: name@gmail.com)";

    const phoneError = getPhoneValidationMessage(form.countryCode, form.phoneNumber);
    if (phoneError) errs.phoneNumber = phoneError;

    if (!form.password) errs.password = "Password is required";
    else if (!isStrongPassword(form.password)) errs.password = passwordPolicyText();
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (name === "email") setEmailOtp(blankOtpState);
    setFormError("");
  };

  const getOtpConfig = (kind) => {
    return {
      type: "email",
      identifier: normalizeEmail(form.email),
      state: emailOtp,
      setState: setEmailOtp,
      refs: emailOtpRefs,
      validate: () => {
        const email = normalizeEmail(form.email);
        if (!email) {
          setErrors((current) => ({ ...current, email: "Email is required" }));
          return false;
        }
        if (!isValidEmail(email)) {
          setErrors((current) => ({ ...current, email: "Enter a valid email address (example: name@gmail.com)" }));
          return false;
        }
        return true;
      },
    };
  };

  const requestOtp = async (kind) => {
    const config = getOtpConfig(kind);
    if (!config.validate()) return;

    setLoading(true);
    setFormError("");
    try {
      const result = await sendOtpApi({
        identifier: config.identifier,
        type: config.type,
      });
      config.setState({
        sent: true,
        verified: false,
        identifier: config.identifier,
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
        secondsLeft: 60,
        cooldown: 60,
        attempts: 0,
        digits: ["", "", "", "", "", ""],
      });
      setToastMessage(result.message || "OTP sent successfully.");
      setToastTone("success");
      window.setTimeout(() => config.refs.current[0]?.focus(), 80);
    } catch (err) {
      setFormError(err?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (kind, index, value) => {
    const config = getOtpConfig(kind);
    const digit = value.replace(/\D/g, "").slice(-1);
    config.setState((current) => {
      const nextDigits = [...current.digits];
      nextDigits[index] = digit;
      return { ...current, digits: nextDigits, verified: false };
    });
    setFormError("");
    if (digit && index < 5) config.refs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (kind, index, event) => {
    const config = getOtpConfig(kind);
    if (event.key === "Backspace" && !config.state.digits[index] && index > 0) {
      config.refs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (kind, event) => {
    const config = getOtpConfig(kind);
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    config.setState((current) => ({ ...current, digits: next }));
    config.refs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const verifyOtp = async (kind) => {
    const config = getOtpConfig(kind);
    const code = config.state.digits.join("");
    if (code.length !== 6 || config.state.secondsLeft <= 0) return;
    setLoading(true);
    setFormError("");
    try {
      await verifyOtpApi({
        identifier: config.state.identifier,
        code,
      });
      config.setState((current) => ({ ...current, verified: true, sent: false, digits: ["", "", "", "", "", ""] }));
      setToastMessage("Email verified successfully.");
      setToastTone("success");
    } catch (err) {
      const nextAttempts = config.state.attempts + 1;
      config.setState((current) => ({
        ...current,
        attempts: nextAttempts,
        sent: nextAttempts >= 3 ? false : current.sent,
        digits: ["", "", "", "", "", ""],
      }));
      window.setTimeout(() => config.refs.current[0]?.focus(), 80);
      setFormError(
        nextAttempts >= 3
          ? "Too many incorrect OTP attempts. Please request a new code."
          : err?.message || "OTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderOtpControl = (kind) => {
    const config = getOtpConfig(kind);
    const label = "Email";
    const canVerify = config.state.digits.join("").length === 6 && config.state.secondsLeft > 0 && !loading;

    if (config.state.verified) {
      return (
        <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800">
          {label} verified
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {config.state.sent ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Enter {label} OTP
              </span>
              <span className={["text-[11px] font-bold", config.state.secondsLeft > 0 ? "text-slate-500" : "text-red-600"].join(" ")}>
                {config.state.secondsLeft > 0 ? formatSeconds(config.state.secondsLeft) : "Expired"}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2" onPaste={(event) => handleOtpPaste(kind, event)}>
              {config.state.digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    config.refs.current[index] = node;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleOtpChange(kind, index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(kind, index, event)}
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-center text-base font-black text-[#004d3d] outline-none transition focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"
                  aria-label={`${label} OTP digit ${index + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={!canVerify}
              onClick={() => verifyOtp(kind)}
              className="mt-3 h-10 w-full rounded-xl bg-[#004d3d] text-[12px] font-black text-white transition hover:bg-[#00392d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verify OTP
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.agree) {
      setToastMessage("Please agree to the Terms & Privacy Policy.");
      setToastTone("warn");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (ENABLE_EMAIL_OTP && !emailOtp.verified) {
      setFormError("Please verify your email address before creating your account.");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        fullName: String(form.fullName || "").trim(),
        email: normalizeEmail(form.email),
        phoneNumber: `${form.countryCode} ${String(form.phoneNumber || "").trim()}`,
        password: form.password,
        role: "trainer",
      });
      navigate(PATHS.TRAINER_DASHBOARD, {
        replace: true,
      });
    } catch (err) {
      setFormError(err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="auth-shell flex min-h-dvh w-full">
        {/* ── LEFT PANEL (Desktop Only) ── */}
        <div className="hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0f2d1f]/95 via-[#0f2d1f]/85 to-[#0f2d1f]/40" />
          </div>
          <div className="absolute top-10 left-12 z-10"><Logo /></div>
        </div>

        {/* ── RIGHT PANEL (Mobile Friendly) ── */}
        <div className="flex min-h-0 flex-1 flex-col bg-transparent">
          <div className="relative z-10 flex min-h-dvh flex-1 flex-col justify-start px-4 py-6 sm:px-6 lg:px-8 xl:py-10">
            <div className="auth-card w-full max-w-[640px] mx-auto rounded-[28px] p-5 sm:p-7">
              <div className="auth-content">
              
              <div className="flex justify-center mb-5">
                <div className="auth-mark rounded-full bg-white p-2 ring-1 ring-[#004d3d]/10">
                  <Logo dark />
                </div>
              </div>
              
              <div className="anim-1 mb-5 text-center">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#54d410]">LurnStack Sign Up</p>
                <h1 className="text-2xl lg:text-3xl font-black text-[#004d3d] mb-1">
                  Sign Up
                </h1>
                <p className="text-slate-500 text-[12px] font-semibold leading-relaxed">
                  Enter your details and verify your email to start learning.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-3.5 anim-3">
                {formError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
                    {formError}
                  </div>
                ) : null}
                <div>
                  <label
                    htmlFor="signup-fullname"
                    className="block text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 ml-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="signup-fullname"
                    type="text"
                    name="fullName"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={handleChange}
                    className={`w-full h-11 px-4 rounded-xl bg-slate-50 border text-[13px] outline-none transition-all
                      ${
                        errors.fullName
                          ? "border-red-400"
                          : "border-slate-200 focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"
                      }`}
                  />
                  {errors.fullName ? (
                    <div className="mt-1 ml-1 text-[10px] font-semibold text-red-600">
                      {errors.fullName}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 ml-1"
                  >
                    Email Address
                  </label>
                  <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-[1fr_auto]">
                    <input
                      id="signup-email"
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={form.email}
                      onChange={handleChange}
                      className={`min-w-0 h-11 px-4 rounded-xl bg-slate-50 border text-[13px] outline-none transition-all
                        ${
                          errors.email
                            ? "border-red-400"
                            : "border-slate-200 focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"
                        }`}
                    />
                    {ENABLE_EMAIL_OTP && !emailOtp.verified && form.email.trim() ? (
                      <button
                        type="button"
                        disabled={loading || emailOtp.cooldown > 0}
                        onClick={() => requestOtp("email")}
                        className="h-9 self-center rounded-full border border-[#004d3d]/20 bg-white px-3 text-[11px] font-black text-[#004d3d] shadow-sm transition hover:border-[#54d410]/50 hover:bg-[#54d410]/10 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        {emailOtp.cooldown > 0 ? `${emailOtp.cooldown}s` : emailOtp.sent ? "Resend" : "Verify"}
                      </button>
                    ) : null}
                  </div>
                  {errors.email ? (
                    <div className="mt-1 ml-1 text-[10px] font-semibold text-red-600">
                      {errors.email}
                    </div>
                  ) : null}
                  {ENABLE_EMAIL_OTP ? renderOtpControl("email") : null}
                </div>

                <div>
                  <label
                    htmlFor="signup-phone"
                    className="block text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 ml-1"
                  >
                    Phone Number
                  </label>
                  <div className="grid grid-cols-[minmax(132px,0.45fr)_minmax(0,1fr)] gap-2">
                    <div className="relative">
                      <select
                        name="countryCode"
                        value={form.countryCode}
                        onChange={handleChange}
                        aria-label="Country code"
                        className="appearance-none h-11 w-full rounded-xl bg-slate-50 border border-slate-200 pl-3 pr-8 text-[12px] font-semibold text-slate-700 outline-none transition-all focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"
                      >
                        {COUNTRY_CODES.map((country) => (
                          <option key={`${country.name}-${country.code}`} value={country.code}>
                            {country.name} ({country.code})
                          </option>
                        ))}
                      </select>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      id="signup-phone"
                      type="tel"
                      name="phoneNumber"
                      placeholder="Enter phone number"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      className={`min-w-0 flex-1 h-11 px-4 rounded-xl bg-slate-50 border text-[13px] outline-none transition-all
                        ${
                          errors.phoneNumber
                            ? "border-red-400"
                            : "border-slate-200 focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"
                        }`}
                    />
                  </div>
                  {errors.phoneNumber ? (
                    <div className="mt-1 ml-1 text-[10px] font-semibold text-red-600">
                      {errors.phoneNumber}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 ml-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter password"
                      value={form.password}
                      onChange={handleChange}
                      className={`w-full h-11 px-4 pr-12 rounded-xl bg-slate-50 border text-[13px] outline-none transition-all
                        ${
                          errors.password
                            ? "border-red-400"
                            : "border-slate-200 focus:border-[#004d3d] focus:ring-4 focus:ring-[#004d3d]/5"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 px-4 text-slate-400"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
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

                <div className="pt-0.5">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="agree"
                      checked={form.agree}
                      onChange={handleChange}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-[#004d3d] focus:ring-[#004d3d]/20"
                    />
                    <span className="text-[11px] text-slate-600 leading-tight">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setActiveModal("terms")}
                        className="font-bold text-slate-600 hover:text-[#004d3d] transition-colors underline decoration-slate-200 underline-offset-2"
                      >
                        Terms
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={() => setActiveModal("privacy")}
                        className="font-bold text-slate-600 hover:text-[#004d3d] transition-colors underline decoration-slate-200 underline-offset-2"
                      >
                        Privacy
                      </button>
                      .
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#004d3d] hover:bg-[#00392d] active:scale-[0.98] text-white font-bold text-[13px] transition-all shadow-[0_16px_36px_rgba(0,77,61,0.22)] flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <p className="mt-2 text-center text-[11px] text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-[#004d3d] hover:underline transition-colors"
                >
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PolicyModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onAccept={handleAcceptPolicy}
      />
      <Toast message={toastMessage} tone={toastTone} onClose={() => setToastMessage("")} />
    </>
  );
}
