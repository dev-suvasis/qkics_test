import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaEdit, FaEye, FaSearch, FaFilter, FaPlus, FaFileAlt } from "react-icons/fa";
import { MdToggleOn, MdToggleOff } from "react-icons/md";
import DocumentFormModal from "../adminComponents/DocumentFormModal";
import DocumentSettingsModal from "../adminComponents/DocumentSettingsModal";

export default function AdminDocuments({ theme }) {
  const isDark = theme === "dark";

  const [documents, setDocuments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  const [settings, setSettings] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  /* ================= FETCH DOCUMENTS ================= */
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/documents/admin/list/");
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setDocuments(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axiosSecure.get("/v1/documents/admin/settings/");
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchSettings();
  }, []);

  /* ================= SEARCH FILTER ================= */
  useEffect(() => {
    const s = searchText.toLowerCase();
    setFiltered(
      documents?.filter(
        (d) =>
          d.title.toLowerCase().includes(s) ||
          d.access_type.toLowerCase().includes(s)
      ) || []
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

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            Documents Management
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingDoc(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
        >
          <FaPlus /> Upload Document
        </button>
      </div>

      {/* Settings Area */}
      {settings && (
        <div className={`p-6 rounded-xl border sm:flex-row flex flex-col justify-between items-center gap-4 ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col">
              <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Upload Limit</span>
              <span className={`text-2xl font-black ${isDark ? "text-blue-400" : "text-blue-600"}`}>{settings.monthly_upload_limit} <span className="text-sm font-medium opacity-50">/ month</span></span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Download Limit</span>
              <span className={`text-2xl font-black ${isDark ? "text-blue-400" : "text-blue-600"}`}>{settings.monthly_download_limit} <span className="text-sm font-medium opacity-50">/ month</span></span>
            </div>
            <div className="flex flex-col justify-center">
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>Last Updated</span>
              <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>{new Date(settings.updated_at).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors border ${isDark ? "border-gray-700 hover:bg-gray-800 text-gray-200" : "border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
          >
            <FaEdit /> Edit Settings
          </button>
        </div>
      )}

      {/* Filters Area */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
        <div className={`relative w-full sm:max-w-md flex items-center`}>
          <FaSearch className={`absolute left-3 text-[0.8rem] ${isDark ? "text-gray-500" : "text-gray-400"}`} />
          <input
            type="text"
            placeholder="Search documents by title or access type..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"
              }`}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm transition-colors duration-200 ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}>
            <FaFilter className="text-xs" /> Filter
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-800 bg-[#111111]" : "border-gray-200 bg-white shadow-sm"}`}>
        {!loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase font-semibold ${isDark ? "bg-gray-800/50 text-gray-400 border-b border-gray-800" : "bg-gray-50 text-gray-600 border-b border-gray-200"}`}>
                <tr>
                  <th className="py-4 px-5">Title</th>
                  <th className="py-4 px-5 w-1/3">Description</th>
                  <th className="py-4 px-5 text-center">Access</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-200"}`}>
                {filtered?.map((doc) => (
                  <tr key={doc.uuid} className={`transition-colors duration-200 ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                    <td className={`py-3 px-5 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>{doc.title}</td>
                    <td className={`py-3 px-5 text-xs truncate max-w-[200px] ${isDark ? "text-gray-500" : "text-gray-500"}`}>{doc.description}</td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[0.7rem] font-medium uppercase tracking-wider ${isDark ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-700"}`}>
                        {doc.access_type}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-medium ${doc.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                        {doc.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-1.5 rounded-md transition-colors ${isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`}
                          title="View Document"
                        >
                          <FaEye />
                        </a>

                        <button
                          onClick={() => {
                            setEditingDoc(doc);
                            setShowModal(true);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? "text-gray-400 hover:bg-gray-400/10" : "text-gray-600 hover:bg-gray-50"}`}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => toggleStatus(doc)}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? "text-amber-400 hover:bg-amber-400/10" : "text-amber-600 hover:bg-amber-50"}`}
                          title={doc.is_active ? "Deactivate" : "Activate"}
                        >
                          {doc.is_active ? <MdToggleOn size={18} /> : <MdToggleOff size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!filtered || filtered.length === 0) && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaFileAlt className={`text-3xl mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                        <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>No documents found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading documents...</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <DocumentFormModal
          document={editingDoc}
          onClose={() => setShowModal(false)}
          onSuccess={fetchDocuments}
          isDark={isDark}
        />
      )}

      <DocumentSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSuccess={fetchSettings}
        isDark={isDark}
      />
    </div>
  );
}
