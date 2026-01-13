import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

export default function TagsTable({ theme }) {
  const isDark = theme === "dark";
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [tags, setTags] = useState([]);
  const [filtered, setFiltered] = useState([]); // <- NEW
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [tagName, setTagName] = useState("");
  const [editTag, setEditTag] = useState(null);

  const [searchText, setSearchText] = useState(""); // <- NEW

  /* ----------------------------
        FETCH TAGS
  ---------------------------- */
  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/community/tags/");
      setTags(res.data);
      setFiltered(res.data); // <- Initialize filtered list
    } catch (err) {
      console.error(err);
      showAlert("Failed to load tags", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  /* ----------------------------
        SEARCH FILTER
  ---------------------------- */
  useEffect(() => {
    const s = searchText.toLowerCase();

    const f = tags.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.slug.toLowerCase().includes(s)
    );

    setFiltered(f);
  }, [searchText, tags]);

  /* ----------------------------
        ADD TAG
  ---------------------------- */
  const handleAddTag = async (name) => {
    if (!name.trim()) return showAlert("Tag name cannot be empty", "error");

    try {
      const res = await axiosSecure.post("/v1/community/tags/", {
        name: name.trim(),
      });

      const updated = [...tags, res.data];
      setTags(updated);
      setFiltered(updated);

      setShowAddModal(false);
      showAlert("Tag added successfully!", "success");
    } catch (err) {
      showAlert("Failed to add tag", "error");
    }
  };

  /* ----------------------------
        EDIT TAG
  ---------------------------- */
  const handleEditTag = async (name) => {
    if (!editTag || !name.trim()) return;

    try {
      const res = await axiosSecure.put(`/v1/community/tags/${editTag.id}/`, {
        name: name.trim(),
      });

      const updated = tags.map((t) =>
        t.id === editTag.id ? res.data : t
      );

      setTags(updated);
      setFiltered(updated);

      setShowEditModal(false);
      setEditTag(null);

      showAlert("Tag updated successfully!", "success");
    } catch {
      showAlert("Failed to update tag", "error");
    }
  };

  /* ----------------------------
        DELETE TAG
  ---------------------------- */
  const handleDeleteTag = (id) => {
    showConfirm({
      title: "Delete Tag?",
      message: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/tags/${id}/`);
          const updated = tags.filter((t) => t.id !== id);

          setTags(updated);
          setFiltered(updated);

          showAlert("Tag deleted!", "success");
        } catch {
          showAlert("Failed to delete tag", "error");
        }
      },
    });
  };

  /* ----------------------------
        MODAL COMPONENT
  ---------------------------- */
  const Modal = ({ title, onClose, onSubmit, placeholder }) => {
    const [localName, setLocalName] = useState(tagName);

    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`p-6 rounded-xl w-[350px] border shadow-lg ${
            isDark
              ? "bg-neutral-900 border-neutral-700 text-white"
              : "bg-white border-neutral-300"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-3">{title}</h3>

          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white"
                : "bg-neutral-100 border-neutral-300"
            }`}
          />

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border border-grey-400 bg-grey-400/10 text-grey-700 dark:border-grey-500 dark:bg-grey-500/20 dark:text-grey-300"
            >
              Cancel
            </button>

            <button
              onClick={() => onSubmit(localName)}
              className="px-4 py-2 rounded-lg text-sm border border-green-400 bg-green-400/10 text-green-700 dark:border-green-500 dark:bg-green-500/20 dark:text-green-300"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* =============================================================== */

  return (
    <div
      className={`p-6 rounded-xl shadow-md border ${
        isDark
          ? "bg-neutral-900/60 border-neutral-700 text-white"
          : "bg-white/70 border-neutral-200 text-neutral-800"
      }`}
    >
      {/* HEADER + SEARCH */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Tags</h2>

        {/* SEARCH BOX */}
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)} // <- live search
          placeholder="Search Tags . . ."
          className={`
            px-3 py-2 rounded-lg text-sm border w-52 mr-3
            ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-100 border-neutral-300"}
          `}
        />

        {/* ADD BUTTON */}
        <button
          onClick={() => {
            setTagName("");
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-lg font-medium border border-green-400 bg-green-400/10 text-green-700 dark:border-green-500 dark:bg-green-500/20 dark:text-green-300"
        >
          + Add Tag
        </button>
      </div>

      {/* HEADER LINE */}
      <div className={`w-full h-px mb-4 ${isDark ? "bg-neutral-700" : "bg-neutral-300"}`} />

      {/* TABLE */}
      {!loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`${
                  isDark ? "text-neutral-400" : "text-neutral-600"
                } text-xs uppercase`}
              >
                <th className="py-3 px-3 text-left">Sl No</th>
                <th className="py-3 px-3 text-left">Tag Name</th>
                <th className="py-3 px-3 text-left">Slug</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>

              <tr>
                <td colSpan="4">
                  <div
                    className={`w-full h-px ${
                      isDark ? "bg-neutral-700" : "bg-neutral-300"
                    }`}
                  />
                </td>
              </tr>
            </thead>

            <tbody>
              {filtered.map((tag, index) => (
                <tr
                  key={tag.id}
                  className={`border-b ${
                    isDark
                      ? "border-neutral-700 hover:bg-neutral-800/40"
                      : "border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <td className="py-3 px-3">{index + 1}</td>
                  <td className="py-3 px-3 font-medium">{tag.name}</td>
                  <td className="py-3 px-3">{tag.slug}</td>

                  <td className="py-3 px-3 flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setEditTag(tag);
                        setTagName(tag.name);
                        setShowEditModal(true);
                      }}
                      className="p-2 rounded-lg text-blue-600 border border-blue-400 bg-blue-400/10 hover:bg-blue-400/20 dark:text-blue-300 dark:border-blue-500 dark:bg-blue-500/20"
                    >
                      <FaEdit size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-2 rounded-lg text-red-600 border border-red-400 bg-red-400/10 hover:bg-red-400/20 dark:text-red-300 dark:border-red-500 dark:bg-red-500/20"
                    >
                      <FaTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-6 opacity-60">
                    No tags found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-10 text-center opacity-70 text-sm">Loading tags...</p>
      )}

      {/* MODALS */}
      {showAddModal && (
        <Modal
          title="Add New Tag"
          placeholder="Enter tag name..."
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTag}
        />
      )}

      {showEditModal && (
        <Modal
          title="Edit Tag"
          placeholder="Update tag name..."
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditTag}
        />
      )}
    </div>
  );
}
