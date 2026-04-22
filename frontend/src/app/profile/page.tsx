"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import {
  Mail,
  MapPin,
  Phone,
  Settings,
  Lock,
  Trash2,
  User,
  Eye,
  EyeOff,
  Bell,
  Shield,
  LogOut,
  AlertTriangle,
} from "lucide-react";

type Tab = "account" | "settings" | "security" | "danger";

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, setUser, isHydrated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    twoFactorAuth: false,
    publicProfile: false,
  });

  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }
    apiClient.setToken(token);
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zip_code: user.zip_code || "",
        country: user.country || "",
      });
      setLoading(false);
    }
  }, [isHydrated, token, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSettingChange = (
    setting: keyof typeof settings,
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
    toast.success(`Setting updated!`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.updateUserProfile(formData);
      setUser({
        ...user!,
        ...formData,
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      toast.error("Please type the correct confirmation message");
      return;
    }

    setDeleting(true);
    try {
      await apiClient.deleteUserAccount();
      toast.success("Account deleted successfully");
      logout();
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (!token || loading) {
    return null;
  }

  const deleteConfirmValid = deleteConfirmText === "DELETE MY ACCOUNT";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {user?.first_name.charAt(0).toUpperCase()}
              {user?.last_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mb-2">
                <Mail size={16} />
                {user?.email}
              </p>
              {user?.is_admin && (
                <span className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Administrator
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-lg shadow-md p-2">
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "account"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <User size={18} />
            Account
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "settings"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Settings size={18} />
            Settings
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "security"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Lock size={18} />
            Security
          </button>
          <button
            onClick={() => setActiveTab("danger")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "danger"
                ? "bg-red-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Trash2 size={18} />
            Danger Zone
          </button>
        </div>

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Account Information
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  isEditing
                    ? "bg-gray-500 text-white hover:bg-gray-600"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isEditing ? "Cancel" : "Edit Information"}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Enter street address"
                  />
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      State / Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Country"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-600 text-sm font-semibold mb-2">
                      First Name
                    </p>
                    <p className="text-xl font-semibold text-gray-800">
                      {formData.first_name || "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-600 text-sm font-semibold mb-2">
                      Last Name
                    </p>
                    <p className="text-xl font-semibold text-gray-800">
                      {formData.last_name || "-"}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {user?.email}
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formData.phone || "-"}
                  </p>
                </div>

                {/* Address */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    Address
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formData.address || "-"}
                  </p>
                  {(formData.city ||
                    formData.state ||
                    formData.zip_code ||
                    formData.country) && (
                    <div className="text-gray-600 mt-2 space-y-1">
                      <p>
                        {formData.city && formData.state && formData.zip_code
                          ? `${formData.city}, ${formData.state} ${formData.zip_code}`
                          : formData.city || formData.state || formData.zip_code
                            ? `${formData.city} ${formData.state} ${formData.zip_code}`
                            : "-"}
                      </p>
                      {formData.country && <p>{formData.country}</p>}
                    </div>
                  )}
                </div>

                {/* Account Status */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold mb-3">
                    Account Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                      Active
                    </span>
                    {user?.is_admin && (
                      <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold text-sm">
                        Administrator
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              Notification & Privacy Settings
            </h2>

            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <Bell className="text-green-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-800">
                      Email Notifications
                    </p>
                    <p className="text-gray-600 text-sm">
                      Receive updates about your account activities
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      handleSettingChange(
                        "emailNotifications",
                        e.target.checked,
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                </label>
              </div>

              {/* Order Updates */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <Mail className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-800">Order Updates</p>
                    <p className="text-gray-600 text-sm">
                      Get notified about order status and shipping
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.orderUpdates}
                    onChange={(e) =>
                      handleSettingChange("orderUpdates", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                </label>
              </div>

              {/* Promotional Emails */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <Mail className="text-yellow-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-800">
                      Promotional Emails
                    </p>
                    <p className="text-gray-600 text-sm">
                      Receive special offers and promotions
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.promotionalEmails}
                    onChange={(e) =>
                      handleSettingChange("promotionalEmails", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                </label>
              </div>

              {/* Public Profile */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <User className="text-purple-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-800">
                      Public Profile
                    </p>
                    <p className="text-gray-600 text-sm">
                      Make your profile visible to other users
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.publicProfile}
                    onChange={(e) =>
                      handleSettingChange("publicProfile", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 border border-transparent dark:border-gray-800 transition-colors">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">
              Security & Password
            </h2>

            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-4">
                  <Shield className="text-red-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Two-Factor Authentication
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) =>
                      handleSettingChange("twoFactorAuth", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                </label>
              </div>

              {/* Change Password */}
              <button className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-4">
                  <Lock className="text-blue-600" size={24} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Change Password
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Update your password regularly for security
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 dark:text-gray-500">→</span>
              </button>

              {/* Login Activity */}
              <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50 transition-colors">
                <div className="flex items-start gap-4">
                  <Shield
                    className="text-blue-600 flex-shrink-0 mt-1"
                    size={24}
                  />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Last Login
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Current session active. Your account is secure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors">
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Active Sessions
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        Current Device
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        This browser · Just now
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === "danger" && (
          <div className="bg-red-50 rounded-lg shadow-md p-8 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="text-red-600" size={28} />
              <h2 className="text-2xl font-bold text-red-600">Danger Zone</h2>
            </div>

            <p className="text-gray-600 mb-8">
              These actions are permanent and cannot be undone. Please proceed
              with caution.
            </p>

            <div className="space-y-6">
              {/* Delete Account */}
              <div className="p-6 bg-white rounded-lg border-2 border-red-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Trash2 className="text-red-600" size={28} />
                    <div>
                      <p className="font-bold text-red-600 text-lg">
                        Delete Account
                      </p>
                      <p className="text-gray-600 text-sm">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Delete My Account
                </button>
              </div>

              {/* Logout All */}
              <div className="p-6 bg-white rounded-lg border-2 border-yellow-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <LogOut className="text-yellow-600" size={28} />
                    <div>
                      <p className="font-bold text-yellow-600 text-lg">
                        Logout All Sessions
                      </p>
                      <p className="text-gray-600 text-sm">
                        Sign out from all devices except this one
                      </p>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition">
                  Logout All Sessions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600" size={28} />
              <h3 className="text-2xl font-bold text-gray-800">
                Delete Account?
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              This action is permanent. Once you delete your account:
            </p>

            <ul className="space-y-2 text-gray-600 text-sm mb-6 bg-red-50 p-4 rounded-lg">
              <li className="flex items-center gap-2">
                <span className="text-red-600 font-bold">•</span>
                Your profile will be permanently deleted
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-600 font-bold">•</span>
                All personal data will be removed
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-600 font-bold">•</span>
                Your shopping history will be cleared
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-600 font-bold">•</span>
                This cannot be undone
              </li>
            </ul>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To confirm, type:{" "}
                <span className="text-red-600">DELETE MY ACCOUNT</span>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) =>
                  setDeleteConfirmText(e.target.value.toUpperCase())
                }
                placeholder="Type confirmation message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmValid || deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
