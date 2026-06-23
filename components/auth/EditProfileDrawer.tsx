"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { playClickSound } from "@/lib/audio"
import AuthField from "@/components/auth/AuthField"
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
  const [activeTab, setActiveTab] = useState<"info" | "password">("info")
  
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

    // Form validation
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
        <div className="fixed inset-0 z-60 flex flex-col justify-end pointer-events-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[3px] pointer-events-auto"
            onClick={() => {
              playClickSound("click")
              onClose()
            }}
          />

          {/* Slide-up Profile Editor Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250, mass: 0.9 }}
            className="relative w-full max-w-lg mx-auto bg-surface/90 border border-border border-b-0 backdrop-blur-[40px] rounded-t-[38px] p-6 pb-10 shadow-[0_-15px_50px_rgba(0,0,0,0.25)] pointer-events-auto flex flex-col select-none max-h-[85vh] overflow-y-auto"
          >
            {/* iOS Drag Handle */}
            <div className="w-10 h-[5px] rounded-full bg-text-tertiary/30 mx-auto mb-5 mt-1 shrink-0" />

            {/* Close Button */}
            <button
              onClick={() => {
                playClickSound("click")
                onClose()
              }}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-black/15 dark:border-white/15 text-text-primary flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6">
              <span className="text-[13px] font-semibold tracking-wide text-accent font-sans block mb-0.5 uppercase">
                Account Settings
              </span>
              <h3 className="text-[21px] font-sans font-bold text-text-primary">
                Edit Profile
              </h3>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-surface-secondary/50 p-1.5 rounded-xl border border-border/10 mb-6 max-w-sm shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClickSound("click")
                  setActiveTab("info")
                  setError(null)
                  setSuccess(null)
                }}
                className={`flex-1 text-[12px] font-bold py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "info"
                    ? "bg-surface text-accent shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Profile Info
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound("click")
                  setActiveTab("password")
                  setError(null)
                  setSuccess(null)
                }}
                className={`flex-1 text-[12px] font-bold py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "password"
                    ? "bg-surface text-accent shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Security & Password
              </button>
            </div>

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

            {activeTab === "info" ? (
              <form onSubmit={handleSaveProfile} className="space-y-5 flex-1">
                {/* 1. Name & Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AuthField
                    id="displayName"
                    label="Display Name"
                    value={name}
                    onChange={setName}
                    placeholder="Ada Lovelace"
                    disabled={loading}
                  />
                  <AuthField
                    id="username"
                    label="Username"
                    value={username}
                    onChange={setUsername}
                    placeholder="ada_lovelace"
                    disabled={loading}
                  />
                </div>

                {/* 2. Avatar Selection Presets */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-text-secondary">
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
                            isSelected ? "border-accent scale-[1.05]" : "border-border/10"
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Custom Image URL */}
                <AuthField
                  id="avatarUrl"
                  label="Or enter custom Image URL"
                  value={image}
                  onChange={setImage}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={loading}
                />

                {/* 4. Social Links */}
                <div className="border-t border-border/10 pt-4 space-y-4">
                  <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                    Social Profiles
                  </span>
                  <div className="space-y-4">
                    <AuthField
                      id="githubUrl"
                      label="GitHub Profile URL"
                      value={githubUrl}
                      onChange={setGithubUrl}
                      placeholder="https://github.com/username"
                      disabled={loading}
                    />
                    <AuthField
                      id="twitterUrl"
                      label="Twitter/X Profile URL"
                      value={twitterUrl}
                      onChange={setTwitterUrl}
                      placeholder="https://twitter.com/username"
                      disabled={loading}
                    />
                    <AuthField
                      id="websiteUrl"
                      label="Personal Website URL"
                      value={websiteUrl}
                      onChange={setWebsiteUrl}
                      placeholder="https://example.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-accent hover:opacity-90 disabled:opacity-50 text-white font-sans text-sm font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm shrink-0 mt-6"
                >
                  {loading ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-5 flex-1">
                {initialUser?.passwordHash && (
                  <AuthField
                    id="currentPassword"
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                )}
                <AuthField
                  id="newPassword"
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="At least 8 characters"
                  disabled={loading}
                />
                <AuthField
                  id="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  disabled={loading}
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-accent hover:opacity-90 disabled:opacity-50 text-white font-sans text-sm font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm shrink-0 mt-6"
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
