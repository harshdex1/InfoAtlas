import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  LogOut,
  Sparkles,
  Users,
  KeyRound,
  Trash2,
  Edit3,
  Search,
  UserPlus,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Play,
} from "lucide-react";
import { UserRole, StoredUserAccount } from "../types";

interface ProfileModalProps {
  onClose: () => void;
  isDark: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, isDark }) => {
  const { t } = useLanguage();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const {
    user,
    logout,
    isAdmin,
    accounts,
    refreshAccounts,
    updateUserRole,
    resetUserPassword,
    deleteUserAccount,
    createUserAccount,
    updateProfile,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "admin">(isAdmin ? "admin" : "profile");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Action states
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Self-service Profile Settings states
  const [editDisplayName, setEditDisplayName] = useState<string>(user?.displayName || "");
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [profileNewPassword, setProfileNewPassword] = useState<string>("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState<string>("");
  const [showProfilePassword, setShowProfilePassword] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  // Reset Password Dialog state
  const [resetTargetUser, setResetTargetUser] = useState<StoredUserAccount | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState<string>("");
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // Delete User Dialog state
  const [deleteTargetUser, setDeleteTargetUser] = useState<StoredUserAccount | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

  // Add User Dialog state
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("user");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) {
      showNotification("error", "Your full name cannot be blank.");
      return;
    }
    setIsSavingName(true);
    const res = await updateProfile(editDisplayName.trim());
    setIsSavingName(false);
    if (res.success) {
      showNotification("success", "Display name updated successfully.");
    } else {
      showNotification("error", res.error || "Failed to update name.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileNewPassword || profileNewPassword.trim().length < 4) {
      showNotification("error", "New password must be at least 4 characters long.");
      return;
    }
    if (profileNewPassword !== profileConfirmPassword) {
      showNotification("error", "New password and confirmation do not match.");
      return;
    }
    setIsSavingPassword(true);
    const res = await updateProfile(user?.displayName || editDisplayName || "Explorer", profileNewPassword.trim());
    setIsSavingPassword(false);
    if (res.success) {
      showNotification("success", "Password updated successfully.");
      setProfileNewPassword("");
      setProfileConfirmPassword("");
    } else {
      showNotification("error", res.error || "Failed to update password.");
    }
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshAccounts();
    setIsRefreshing(false);
    showNotification("success", "User accounts updated successfully.");
  };

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    const res = await updateUserRole(targetUid, newRole);
    if (res.success) {
      showNotification("success", `Role successfully updated to ${newRole.toUpperCase()}.`);
    } else {
      showNotification("error", res.error || "Failed to update role.");
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setIsSubmittingReset(true);
    const res = await resetUserPassword(resetTargetUser.uid, newPasswordVal);
    setIsSubmittingReset(false);
    if (res.success) {
      showNotification("success", `Password for ${resetTargetUser.email} has been updated.`);
      setResetTargetUser(null);
      setNewPasswordVal("");
    } else {
      showNotification("error", res.error || "Password reset failed.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    setIsSubmittingDelete(true);
    const res = await deleteUserAccount(deleteTargetUser.uid);
    setIsSubmittingDelete(false);
    if (res.success) {
      showNotification("success", `Account ${deleteTargetUser.email} was removed.`);
      setDeleteTargetUser(null);
    } else {
      showNotification("error", res.error || "Account deletion failed.");
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);
    const res = await createUserAccount(newUserName, newUserEmail, newUserRole, newUserPassword);
    setIsSubmittingAdd(false);
    if (res.success) {
      showNotification("success", `User ${newUserEmail} created successfully.`);
      setShowAddUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
    } else {
      showNotification("error", res.error || "Account creation failed.");
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (!acc) return false;
    const matchesSearch =
      (acc.displayName && acc.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.email && acc.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.uid && acc.uid.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || acc.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = accounts.length;
  const googleUsers = accounts.filter((a) => a.provider === "google").length;
  const adminUsers = accounts.filter((a) => a.role === "admin" || a.email.toLowerCase() === "admin@infoatlas.app").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full ${
          activeTab === "admin" ? "max-w-4xl" : "max-w-md"
        } max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header with Close and Tabs */}
        <div className={`p-5 sm:p-6 pb-4 border-b flex items-center justify-between shrink-0 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/50"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-600/20">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight">{user?.displayName || "Explorer"}</h2>
                {user?.role === "developer" ? (
                  <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                    Lead Developer
                  </span>
                ) : user?.role === "editor" ? (
                  <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                    Senior Editor
                  </span>
                ) : isAdmin ? (
                  <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full">
                    Super Admin
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700 rounded-full">
                    Explorer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className={`flex p-1 rounded-xl border text-xs font-semibold ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "admin"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: ADMIN CONSOLE */}
        {isAdmin && activeTab === "admin" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Accounts</div>
                <div className="text-xl sm:text-2xl font-bold mt-1 text-indigo-400">{totalUsers}</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Google OAuth</div>
                <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-400">{googleUsers}</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Administrators</div>
                <div className="text-xl sm:text-2xl font-bold mt-1 text-cyan-400">{adminUsers}</div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-slate-950/70 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border focus:outline-none cursor-pointer ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="editor">Editors</option>
                  <option value="user">Users</option>
                </select>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className={`p-2.5 rounded-xl border text-slate-400 hover:text-white transition-all cursor-pointer ${
                    isDark ? "bg-slate-950 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                  title="Refresh accounts list"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Account</span>
                </button>
              </div>
            </div>

            {/* User Accounts List */}
            <div className={`border rounded-2xl overflow-hidden divide-y ${isDark ? "border-slate-800 divide-slate-800/80 bg-slate-950/40" : "border-slate-200 divide-slate-100 bg-white"}`}>
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No accounts found matching your query.
                </div>
              ) : (
                filteredAccounts.map((acc) => {
                  const isRootAdmin = acc.email.toLowerCase() === "admin@infoatlas.app";
                  const isCurrentLoggedUser = user?.uid === acc.uid;

                  return (
                    <div
                      key={acc.uid}
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Account Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-sm ${
                            isRootAdmin
                              ? "bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white"
                              : acc.provider === "google"
                              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                              : "bg-slate-800 text-slate-200 border border-slate-700"
                          }`}
                        >
                          {acc.displayName ? acc.displayName.charAt(0).toUpperCase() : "U"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold truncate">{acc.displayName}</span>
                            {isCurrentLoggedUser && (
                              <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">You</span>
                            )}
                            {acc.provider === "google" ? (
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                Google
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/20 px-1.5 py-0.5 rounded-full">
                                Email
                              </span>
                            )}
                            {acc.isEmailVerified || acc.provider === "google" || isRootAdmin ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                Verified
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                                Unverified
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                            <span>{acc.email}</span>
                            <span className="text-[10px] text-slate-500">• ID: {acc.uid.slice(0, 10)}...</span>
                          </div>
                        </div>
                      </div>

                      {/* Role Selector & Actions */}
                      <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                        {/* Role selector */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Role:</label>
                          <select
                            disabled={isRootAdmin}
                            value={acc.role || "user"}
                            onChange={(e) => handleRoleChange(acc.uid, e.target.value as UserRole)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold focus:outline-none cursor-pointer ${
                              acc.role === "admin"
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                : acc.role === "editor"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : isDark
                                ? "bg-slate-900 border-slate-800 text-slate-300"
                                : "bg-slate-100 border-slate-200 text-slate-700"
                            } ${isRootAdmin ? "opacity-75 cursor-not-allowed" : ""}`}
                          >
                            <option value="user">User</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setResetTargetUser(acc);
                            setNewPasswordVal("");
                          }}
                          className={`p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            isDark
                              ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                          title="Reset User Password"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                        </button>

                        {/* Delete User Button */}
                        <button
                          type="button"
                          disabled={isRootAdmin}
                          onClick={() => setDeleteTargetUser(acc)}
                          className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                            isRootAdmin
                              ? "opacity-30 cursor-not-allowed border-transparent text-slate-600"
                              : isDark
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          }`}
                          title={isRootAdmin ? "Cannot delete primary admin" : "Delete Account"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY PROFILE */}
        {(!isAdmin || activeTab === "profile") && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="text-center py-2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <h2 className="text-xl font-bold">{user?.displayName || "Explorer"}</h2>
              <p className="text-xs text-indigo-400 font-medium">
                {isAdmin ? "InfoAtlas Super Administrator" : "InfoAtlas Verified Explorer"}
              </p>
            </div>

            <div className="space-y-3">
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Email Address</span>
                    <span className="text-xs font-semibold truncate block">{user?.email}</span>
                  </div>
                </div>
                {(user?.isEmailVerified !== false || user?.provider === "google") && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Gmail
                  </span>
                )}
              </div>

              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Account Role & Security</span>
                  <span className="text-xs font-semibold block text-emerald-400 capitalize">
                    {user?.role || (isAdmin ? "admin" : "Standard Explorer")} • Authenticated Session
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Sign-in Provider</span>
                  <span className="text-xs font-semibold block text-cyan-400 capitalize">
                    {user?.provider === "google" ? "Direct Google Gmail OAuth" : "InfoAtlas Secure Account"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Settings: Change Name & Password */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Profile & Security Settings
                </h3>
              </div>

              {/* 1. Change Display Name Card */}
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Change Display Name</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Visible on comments & profile</span>
                </div>
                <form onSubmit={handleUpdateName} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Your Full Name"
                    className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSavingName || !editDisplayName.trim() || editDisplayName.trim() === user?.displayName}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSavingName ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Name</span>
                  </button>
                </form>
              </div>

              {/* 2. Change Password Card */}
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Change Account Password</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Min. 4 characters</span>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type={showProfilePassword ? "text" : "password"}
                        required
                        value={profileNewPassword}
                        onChange={(e) => setProfileNewPassword(e.target.value)}
                        placeholder="New Password"
                        className={`w-full px-3 py-2 pr-9 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfilePassword(!showProfilePassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                        title={showProfilePassword ? "Hide password" : "Show password"}
                      >
                        {showProfilePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div>
                      <input
                        type={showProfilePassword ? "text" : "password"}
                        required
                        value={profileConfirmPassword}
                        onChange={(e) => setProfileConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSavingPassword || profileNewPassword.length < 4 || profileNewPassword !== profileConfirmPassword}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSavingPassword ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  try {
                    if (typeof window !== "undefined") {
                      window.sessionStorage.removeItem("infoatlas_session_splash_shown");
                    }
                  } catch {}
                  window.dispatchEvent(new CustomEvent("infoatlas_replay_splash"));
                }}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? "bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 border-cyan-800/40"
                    : "bg-cyan-50 hover:bg-cyan-100/80 text-cyan-700 border-cyan-200"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Replay Opening Animation</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of InfoAtlas</span>
              </button>
            </div>
          </div>
        )}

        {/* DIALOG 1: RESET PASSWORD MODAL */}
        {resetTargetUser && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>Reset User Password</span>
                </div>
                <button onClick={() => setResetTargetUser(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Enter a new password for <span className="text-white font-medium">{resetTargetUser.email}</span>:
              </p>

              <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="New password (min 4 chars)"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResetTargetUser(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset || newPasswordVal.length < 4}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReset ? "Saving..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DIALOG 2: CONFIRM DELETE USER */}
        {deleteTargetUser && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Confirm Account Deletion</span>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Are you sure you want to permanently delete the account for <span className="font-semibold text-rose-300">{deleteTargetUser.email}</span>? All user bookmarks and history will be cleared.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetUser(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingDelete}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingDelete ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIALOG 3: ADD NEW USER */}
        {showAddUserModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <UserPlus className="w-4 h-4" />
                  <span>Create New Account</span>
                </div>
                <button onClick={() => setShowAddUserModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewUser} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jordan Lee"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none cursor-pointer ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="user">User</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    placeholder="At least 4 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdd || !newUserName || !newUserEmail || newUserPassword.length < 4}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAdd ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
