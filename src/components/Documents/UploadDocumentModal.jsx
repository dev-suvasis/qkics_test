import { useState } from "react";
import axiosSecure from "../utils/axiosSecure";
import { FiX, FiUpload, FiFileText } from "react-icons/fi";

export default function UploadDocumentModal({ isOpen, onClose, theme, onSuccess }) {
    const isDark = theme === "dark";
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        file: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") {
            setFormData((prev) => ({ ...prev, file: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            setError("Please select a file to upload.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("file", formData.file);
            data.append("access_type", "FREE");

            await axiosSecure.post("/v1/documents/upload/", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (onSuccess) {
                onSuccess();
            }
            onClose();
            setFormData({ title: "", description: "", file: null });
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || err.response?.data?.error || "Failed to upload document. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div
                className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl ${isDark ? "bg-neutral-900 border border-neutral-800 text-white" : "bg-white text-gray-900"
                    }`}
            >
                <div className="relative p-8 pb-4">
                    <button
                        onClick={onClose}
                        className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? "hover:bg-neutral-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                            }`}
                    >
                        <FiX className="text-xl" />
                    </button>

                    <div className="flex items-center gap-2 mb-2 text-red-500 font-bold text-xs uppercase tracking-widest">
                        <FiUpload /> Upload Document
                    </div>
                    <h3 className="text-2xl font-extrabold leading-tight">Add New Resource</h3>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-4 flex flex-col gap-4">
                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter document title"
                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${isDark
                                    ? "bg-neutral-800 border-neutral-700 focus:border-red-500 text-white placeholder-neutral-500"
                                    : "bg-gray-50 border-gray-200 focus:border-red-500 text-black placeholder-gray-400"
                                }`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                            Description
                        </label>
                        <textarea
                            name="description"
                            required
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter document description"
                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-none ${isDark
                                    ? "bg-neutral-800 border-neutral-700 focus:border-red-500 text-white placeholder-neutral-500"
                                    : "bg-gray-50 border-gray-200 focus:border-red-500 text-black placeholder-gray-400"
                                }`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                            File
                        </label>
                        <div className={`relative w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all ${isDark
                                ? "border-neutral-700 hover:border-red-500 bg-neutral-800/50"
                                : "border-gray-200 hover:border-red-500 bg-gray-50/50"
                            }`}>
                            <input
                                type="file"
                                name="file"
                                required
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                                <div className={`p-3 rounded-full ${isDark ? "bg-neutral-700 text-red-400" : "bg-red-50 text-red-500"}`}>
                                    <FiFileText className="text-xl" />
                                </div>
                                {formData.file ? (
                                    <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>{formData.file.name}</span>
                                ) : (
                                    <>
                                        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Click to upload or drag and drop</span>
                                        <span className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-400"}`}>PDF, DOC, DOCX up to 10MB</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                            Access Type
                        </label>
                        <input
                            type="text"
                            value="FREE"
                            disabled
                            className={`w-full px-4 py-3 rounded-xl border text-sm font-bold opacity-70 cursor-not-allowed ${isDark
                                    ? "bg-neutral-800 border-neutral-700 text-emerald-400"
                                    : "bg-gray-100 border-gray-200 text-emerald-600"
                                }`}
                        />
                        <p className={`text-[10px] mt-2 font-medium ${isDark ? "text-neutral-500" : "text-gray-400"}`}>
                            * Documents uploaded here are always set to FREE access type.
                        </p>
                    </div>

                    {error && (
                        <div className={`mt-2 p-3 rounded-lg border text-sm flex items-center gap-2 animate-shake ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-600"
                            }`}>
                            <FiX className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 px-4 py-3 font-bold rounded-xl border transition-all ${isDark
                                    ? "border-neutral-700 hover:bg-neutral-700 text-white"
                                    : "border-gray-200 hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-[2] px-4 py-3 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 ${isSubmitting || !formData.file
                                    ? "bg-gray-400 cursor-not-allowed text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/25"
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <FiUpload className="text-lg" />
                            )}
                            {isSubmitting ? "Uploading..." : "Upload Document"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
