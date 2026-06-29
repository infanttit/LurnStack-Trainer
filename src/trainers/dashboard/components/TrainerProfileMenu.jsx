import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser } from "react-icons/fi";
import { useAuth } from "../../../auth/model/AuthContext";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../app/router/paths";

export default function TrainerProfileMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const profilePhoto = user?.profilePhotoUrl || user?.profilePicture;
  const initials = (user?.fullName || "Trainer").slice(0, 1).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#006b58] bg-emerald-50 text-[#00342b] transition-transform hover:scale-105 active:scale-95"
        aria-label="Profile menu"
      >
        {profilePhoto ? (
          <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-extrabold">{initials}</span>
        )}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50"
          >
            <div className="mb-2 border-b border-slate-100 px-3 pb-3 pt-2">
              <p className="truncate text-sm font-extrabold text-slate-900">{user?.fullName || "Trainer"}</p>
              <p className="truncate text-xs font-semibold text-slate-500">{user?.email}</p>
            </div>
            
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  navigate(PATHS.TRAINER_PROFILE);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-[#006b58]"
              >
                <FiUser className="text-lg" />
                My Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
