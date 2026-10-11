import React from "react";
import { useAuth } from "../context/AuthContext";
import { X, User as UserIcon, Mail, Shield, LogOut, Sparkles } from "lucide-react";

interface ProfileModalProps {
  onClose: () => void;
  isDark: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, isDark }) => {
  const { user, logout } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl relative ${
        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
          </div>
          <h2 className="text-xl font-bold">{user?.displayName || "Explorer"}</h2>
          <p className="text-xs text-indigo-400 font-medium">InfoAtlas Verified Member</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Email Address</span>
              <span className="text-xs font-semibold truncate block">{user?.email}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Account Security</span>
              <span className="text-xs font-semibold block text-emerald-400">Secure Session Active</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
