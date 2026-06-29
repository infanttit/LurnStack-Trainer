import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiUploadCloud, FiImage } from "react-icons/fi";
import { toast } from "react-toastify";

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

export default function ProfilePictureModal({ isOpen, onClose, onSave, currentPicture }) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen && preview) {
    setPreview(null);
    setSelectedFile(null);
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setPreview(dataUrl);
      setSelectedFile(file);
    } catch (err) {
      toast.error("Failed to read image file.");
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      await onSave(selectedFile);
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile picture.");
    } finally {
      setLoading(false);
    }
  };

  const displayPicture = preview || currentPicture;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-xl font-extrabold text-slate-900">Update Profile Picture</h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-emerald-50 bg-slate-100 shadow-inner">
                  {displayPicture ? (
                    <img src={displayPicture} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <FiImage className="text-4xl" />
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
                >
                  <FiUploadCloud className="text-lg text-[#006b58]" />
                  Choose Image
                </button>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  JPG, PNG or WebP. Max size of 5MB.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-50 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!preview || loading}
                className={[
                  "inline-flex min-w-[100px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all",
                  preview && !loading
                    ? "bg-[#006b58] hover:bg-[#005243] active:scale-95"
                    : "cursor-not-allowed bg-slate-300",
                ].join(" ")}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Save Picture"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
