"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { playClickSound } from "@/lib/audio"
import Input from "@/components/auth/Input"
import { updateProfileData, updatePassword } from "@/app/actions/profile"

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&h=150&q=80",
]

interface EditProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialUser: any
  onSaveSuccess: () => void
}

export default function EditProfileDrawer({
  isOpen,
  onClose,
  initialUser,
  onSaveSuccess,
}: EditProfileDrawerProps) {
  // Profile state
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [image, setImage] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [twitterUrl, setTwitterUrl] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name || "")
      setUsername(initialUser.username || "")
      setImage(initialUser.image || "")
      setGithubUrl(initialUser.githubUrl || "")
      setTwitterUrl(initialUser.twitterUrl || "")
      setWebsiteUrl(initialUser.websiteUrl || "")
    }
    setError(null)
    setSuccess(null)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }, [initialUser, isOpen])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (username && !/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      setError("Username must be 3-15 characters and contain only letters, numbers, or underscores")
      setLoading(false)
      return
    }

    const res = await updateProfileData({
      name: name.trim() || null,
      username: username.trim() || null,
      image: image.trim() || null,
      githubUrl: githubUrl.trim() || null,
      twitterUrl: twitterUrl.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
    })

    setLoading(false)
    if (res.success) {
      setSuccess("Profile updated successfully")
      onSaveSuccess()
    } else {
      setError(res.error || "Failed to update profile")
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setLoading(true)
    const res = await updatePassword({
      currentPassword,
      newPassword,
    })

    setLoading(false)
    if (res.success) {
      setSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      setError(res.error || "Failed to update password")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px] pointer-events-auto"
            onClick={() => {
              onClose()
            }}
          />

          {/* Morphing Profile Editor Dialog Panel */}
          <motion.div
            layoutId="edit-profile-card"
            className="relative w-full max-w-2xl bg-neutral-100/95 dark:bg-neutral-900/95 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl rounded-[20px] shadow-[0_15px_50px_rgba(0,0,0,0.18)] pointer-events-auto flex flex-col max-h-[80vh] overflow-hidden"
            style={{ borderRadius: "20px" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {/* FIXED Header & Close Button Area (non-scrollable to prevent shifting) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.15 }}
              className="relative z-20 px-6 pt-6 pb-2 shrink-0 flex justify-between items-start"
            >
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#007aff] dark:text-[#0a84ff] font-sans block mb-1 uppercase">
                  Account Settings
                </span>
                <h3 className="text-[20px] font-sans font-bold text-neutral-800 dark:text-neutral-200">
                  Edit Profile
                </h3>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  playClickSound("click")
                  onClose()
                }}
                className="w-7 h-7 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 hover:bg-neutral-300/60 dark:hover:bg-neutral-700/60 border border-neutral-300/30 dark:border-neutral-700/30 text-neutral-800 dark:text-neutral-200 flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>

            {/* Scrollable Form Body Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.15 }}
              className="relative z-10 px-6 pb-6 overflow-y-auto flex-1 min-h-0"
            >
              {/* Notification messages */}
              {error && (
                <div className="rounded-[10px] bg-incorrect/10 border border-incorrect/30 px-3.5 py-2.5 text-[13px] text-incorrect font-medium mb-4 shrink-0">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-[10px] bg-correct/10 border border-correct/30 px-3.5 py-2.5 text-[13px] text-correct font-medium mb-4 shrink-0">
                  {success}
                </div>
              )}

              {/* Profile Info Section */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="px-1 pb-1 text-[13px] font-bold text-neutral-500 dark:text-neutral-400 select-none">
                  Profile Info
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="displayName"
                    label="Display Name"
                    value={name}
                    onChange={setName}
                    placeholder="Ada Lovelace"
                    disabled={loading}
                  />
                  <Input
                    id="username"
                    label="Username"
                    value={username}
                    onChange={setUsername}
                    placeholder="ada_lovelace"
                    disabled={loading}
                  />
                </div>

                {/* Avatar Selection Presets */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                    Select Avatar Picture
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => {
                      const isSelected = image === preset
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            playClickSound("click")
                            setImage(preset)
                          }}
                          className={`relative aspect-square rounded-full overflow-hidden border-2 cursor-pointer transition-all duration-150 active:scale-[0.95] ${
                            isSelected ? "border-[#007aff] dark:border-[#0a84ff] scale-[1.05]" : "border-border/10"
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Input
                  id="avatarUrl"
                  label="Or enter custom Image URL"
                  value={image}
                  onChange={setImage}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={loading}
                />

                {/* Social Links */}
                <div className="border-t border-border/10 pt-4 space-y-4">
                  <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                    Social Profiles
                  </span>
                  <div className="space-y-4">
                    <Input
                      id="githubUrl"
                      label="GitHub Profile URL"
                      value={githubUrl}
                      onChange={setGithubUrl}
                      placeholder="https://github.com/username"
                      disabled={loading}
                    />
                    <Input
                      id="twitterUrl"
                      label="Twitter/X Profile URL"
                      value={twitterUrl}
                      onChange={setTwitterUrl}
                      placeholder="https://twitter.com/username"
                      disabled={loading}
                    />
                    <Input
                      id="websiteUrl"
                      label="Personal Website URL"
                      value={websiteUrl}
                      onChange={setWebsiteUrl}
                      placeholder="https://example.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-[#007aff] dark:bg-[#0a84ff] hover:opacity-90 disabled:opacity-50 text-white font-sans text-xs font-bold transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm shrink-0"
                >
                  {loading ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </form>

              {/* Security & Password Section */}
              <form onSubmit={handleUpdatePassword} className="space-y-5 mt-8 pt-8 border-t border-border/10">
                <div className="px-1 pb-1 text-[13px] font-bold text-neutral-500 dark:text-neutral-400 select-none">
                  Security & Password
                </div>

                {initialUser?.passwordHash && (
                  <Input
                    id="currentPassword"
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                )}
                <Input
                  id="newPassword"
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="At least 8 characters"
                  disabled={loading}
                />
                <Input
                  id="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-[#007aff] dark:bg-[#0a84ff] hover:opacity-90 disabled:opacity-50 text-white font-sans text-xs font-bold transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm shrink-0"
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
