import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaEdit, FaEye } from "react-icons/fa";
import { MdToggleOn, MdToggleOff } from "react-icons/md";
import DocumentFormModal from "../adminComponents/DocumentFormModal";
import { FiDownload } from "react-icons/fi";

export default function AdminDocuments({ theme }) {
  const isDark = theme === "dark";

  const [documents, setDocuments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  /* ================= FETCH DOCUMENTS ================= */
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/documents/admin/list/");
      setDocuments(res.data.results);
      setFiltered(res.data.results);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  /* ================= SEARCH FILTER ================= */
  useEffect(() => {
    const s = searchText.toLowerCase();
    setFiltered(
      documents.filter(
        (d) =>
          d.title.toLowerCase().includes(s) ||
          d.access_type.toLowerCase().includes(s)
      )
    );
  }, [searchText, documents]);

  /* ================= TOGGLE ACTIVE ================= */
  const toggleStatus = async (doc) => {
    try {
      await axiosSecure.patch(
        `/v1/documents/admin/${doc.uuid}/toggle-status/`,
        { is_active: !doc.is_active }
      );
      fetchDocuments();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleDownload = async (doc) => {
  try {
    const res = await fetch(doc.file);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const safeName =
      (doc.title || "document")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed", err);
  }
};



  return (
    <div
      className={`p-6 rounded-xl shadow-md border ${
        isDark
          ? "bg-neutral-900/60 border-neutral-700 text-white"
          : "bg-white/70 border-neutral-200 text-neutral-800"
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-col items-center justify-between md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold">Documents</h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm border w-56 outline-none ${
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white"
                : "bg-neutral-100 border-neutral-300"
            }`}
          />
        </div>

        <div>
          <button
            onClick={() => {
              setEditingDoc(null);
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-lg font-medium border border-green-400 bg-green-400/10 text-green-700 dark:border-green-500 dark:bg-green-500/20 dark:text-green-300"
          >
            + Upload Document
          </button>
        </div>
      </div>

      <div className={`w-full h-px mb-4 ${isDark ? "bg-neutral-700" : "bg-neutral-300"}`} />

      {/* TABLE */}
      {!loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase border-b ${
                    isDark
                      ? "border-neutral-700 hover:bg-neutral-800/40"
                      : "border-neutral-200 hover:bg-neutral-100"
                  }`}>
                <th className="py-3 px-3 text-left">Title</th>
                <th className="py-3 px-3 text-left">Description</th>
                <th className="py-3 px-3 text-left">File</th>
                <th className="py-3 px-3 text-center">Access</th>
                <th className="py-3 px-3 text-center">Active</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((doc) => (
                <tr
                  key={doc.uuid}
                  className={`border-b ${
                    isDark
                      ? "border-neutral-700 hover:bg-neutral-800/40"
                      : "border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <td className="py-3 px-3 font-medium">{doc.title}</td>
                  <td className="py-3 px-3 max-w-xs truncate">{doc.description}</td>
                  <td className="py-3 px-3">
                    <button
  onClick={() => handleDownload(doc)}
  className="text-blue-500"
  title="Download"
>
  <FiDownload />
</button>



                  </td>
                  <td className="py-3 px-3 text-center">{doc.access_type}</td>
                  <td className="py-3 px-3 text-center">
                    {doc.is_active ? "Active" : "Inactive"}
                  </td>
                  <td className="py-3 px-3 flex justify-center gap-2">
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border text-indigo-500 border-indigo-400 bg-indigo-400/10"
                      title="View Document"
                    >
                      <FaEye size={14} />
                    </a>

                    <button
                      onClick={() => {
                        setEditingDoc(doc);
                        setShowModal(true);
                      }}
                      className="p-2 rounded-lg border text-blue-600 border-blue-400 bg-blue-400/10"
                      title="Edit"
                    >
                      <FaEdit size={14} />
                    </button>

                    <button
                      onClick={() => toggleStatus(doc)}
                      className="p-2 rounded-lg border text-amber-600 border-amber-400 bg-amber-400/10"
                      title="Activate / Deactivate"
                    >
                      {doc.is_active ? <MdToggleOn size={18} /> : <MdToggleOff size={18} />}
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 opacity-60">
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-10 text-center opacity-70 text-sm">Loading documents...</p>
      )}

      {/* MODAL */}
      {showModal && (
        <DocumentFormModal
          document={editingDoc}
          onClose={() => setShowModal(false)}
          onSuccess={fetchDocuments}
          isDark={isDark}
        />
      )}
    </div>
  );
}
