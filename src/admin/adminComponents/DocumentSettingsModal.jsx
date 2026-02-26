import { useState, useEffect } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiX, FiSave } from "react-icons/fi";

export default function DocumentSettingsModal({ isOpen, onClose, settings, onSuccess, isDark }) {
    const [formData, setFormData] = useState({
        monthly_upload_limit: 5,
        monthly_download_limit: 20,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (settings) {
            setFormData({
                monthly_upload_limit: settings.monthly_upload_limit ?? 5,
                monthly_download_limit: settings.monthly_download_limit ?? 20,
            });
        }
    }, [settings]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await axiosSecure.patch("/v1/documents/admin/settings/", formData);
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err) {
            console.error("Failed to update settings", err);
            setError(err.response?.data?.detail || "Failed to update settings. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${isDark ? "bg-[#111111] border border-gray-800 text-gray-200" : "bg-white text-gray-900"
                    }`}
            >
                <div className="relative p-6 pb-2">
                    <button
                        onClick={onClose}
                        className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                            }`}
                    >
                        <FiX className="text-xl" />
                    </button>
                    <h3 className="text-lg font-bold">Document Settings</h3>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Update download and upload limits
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Monthly Upload Limit
                        </label>
                        <input
                            type="number"
                            name="monthly_upload_limit"
                            required
                            min="0"
                            value={formData.monthly_upload_limit}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none ${isDark
                                    ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500 text-white"
                                    : "bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900"
                                }`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Monthly Download Limit
                        </label>
                        <input
                            type="number"
                            name="monthly_download_limit"
                            required
                            min="0"
                            value={formData.monthly_download_limit}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none ${isDark
                                    ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500 text-white"
                                    : "bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900"
                                }`}
                        />
                    </div>

                    {error && (
                        <div className={`mt-2 p-3 rounded-lg border text-sm flex items-center gap-2 ${isDark ? "bg-red-900/20 border-red-900/30 text-red-400" : "bg-red-50 border-red-100 text-red-600"
                            }`}>
                            <FiX className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-5 py-2 font-medium rounded-lg transition-colors ${isDark
                                    ? "hover:bg-gray-800 text-gray-300"
                                    : "hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-5 py-2 font-medium rounded-lg flex items-center gap-2 transition-transform active:scale-95 ${isSubmitting
                                    ? "bg-blue-400 cursor-not-allowed text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                        >
                            <FiSave />
                            {isSubmitting ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
