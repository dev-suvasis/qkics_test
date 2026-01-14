import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";

export default function DocumentFormModal({ document, onClose, onSuccess, isDark }) {
  const isEdit = Boolean(document);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState("FREE");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setDescription(document.description || "");
      setAccessType(document.access_type || "FREE");
    }
  }, [document]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (isEdit) {
        const hasFile = Boolean(file);
        let payload;
        let headers = {};

        if (hasFile) {
          payload = new FormData();
          payload.append("title", title);
          payload.append("description", description);
          payload.append("access_type", accessType);
          payload.append("file", file);
          headers["Content-Type"] = "multipart/form-data";
        } else {
          payload = { title, description, access_type: accessType };
        }

        await axiosSecure.patch(
          `/v1/documents/admin/${document.uuid}/update/`,
          payload,
          { headers }
        );
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("access_type", accessType);
        formData.append("file", file);

        await axiosSecure.post(
          "/v1/documents/admin/upload/",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Document save failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className={`w-full max-w-3xl rounded-xl p-6 shadow-xl border ${
          isDark
            ? "bg-neutral-900 border-neutral-700 text-white"
            : "bg-white border-neutral-200 text-neutral-800"
        }`}
      >
        <h3 className="text-lg font-bold mb-4">
          {isEdit ? "Update Document" : "Upload Document"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded border mt-1 ${
                isDark
                  ? "bg-neutral-800 border-neutral-700"
                  : "bg-neutral-100 border-neutral-300"
              }`}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 rounded border mt-1 ${
                isDark
                  ? "bg-neutral-800 border-neutral-700"
                  : "bg-neutral-100 border-neutral-300"
              }`}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Access Type</label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className={`w-full px-3 py-2 rounded border mt-1 ${
                isDark
                  ? "bg-neutral-800 border-neutral-700"
                  : "bg-neutral-100 border-neutral-300"
              }`}
            >
              <option value="FREE">FREE</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mr-2">
              {isEdit ? "Replace File (optional) :" : "Upload File :"}
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required={!isEdit}
              className="mt-1 border px-3 rounded py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border opacity-80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
