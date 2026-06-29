import { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiUser, FiMail, FiPhone, FiCalendar, FiCamera, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/model/AuthContext";
import ProfilePictureModal from "../dashboard/components/ProfilePictureModal";

export default function MyProfilePage() {
  const { user, updateProfile, updateProfilePicture, removeProfilePicture } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picModalOpen, setPicModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
  });

  const profilePhoto = user?.profilePhotoUrl || user?.profilePicture;
  const initials = (user?.fullName || "Trainer").slice(0, 1).toUpperCase();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast.error("Full Name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePicture = async () => {
    try {
      await removeProfilePicture();
      toast.success("Profile picture removed.");
    } catch (err) {
      toast.error("Failed to remove profile picture.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your personal information and profile picture.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center justify-center border-b border-slate-100 bg-slate-50/50 p-8 sm:flex-row sm:justify-start sm:gap-8">
          <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-50 bg-white text-4xl font-extrabold text-[#006b58] shadow-inner">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="mt-6 flex flex-col items-center sm:mt-0 sm:items-start">
            <h2 className="text-xl font-extrabold text-slate-900">{user?.fullName || "Trainer"}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{user?.role === "trainer" ? "Active Trainer" : user?.role}</p>
            
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setPicModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#006b58] active:scale-95"
              >
                <FiCamera className="text-lg" />
                Update Picture
              </button>
              {profilePhoto && (
                <button
                  type="button"
                  onClick={handleRemovePicture}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95"
                >
                  <FiTrash2 className="text-lg" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900">Personal Details</h3>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
              >
                <FiEdit2 className="text-lg" />
                Edit Details
              </button>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <FiUser className="text-slate-400" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#006b58] focus:ring-4 focus:ring-[#006b58]/10"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
                  {user?.fullName || "Not provided"}
                </p>
              )}
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <FiMail className="text-slate-400" />
                Email Address
              </label>
              <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed">
                {user?.email}
              </p>
              {isEditing && <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <FiPhone className="text-slate-400" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#006b58] focus:ring-4 focus:ring-[#006b58]/10"
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
                  {user?.phoneNumber || "Not provided"}
                </p>
              )}
            </div>

            {/* Joined Date */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <FiCalendar className="text-slate-400" />
                Joined Date
              </label>
              <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
                {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  fullName: user?.fullName || "",
                  phoneNumber: user?.phoneNumber || "",
                });
              }}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-[#006b58] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#005243] active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <FiSave className="text-lg" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <ProfilePictureModal
        isOpen={picModalOpen}
        onClose={() => setPicModalOpen(false)}
        onSave={async (newPicFile) => {
          await updateProfilePicture(newPicFile);
          setPicModalOpen(false);
        }}
        currentPicture={profilePhoto}
      />
    </div>
  );
}
