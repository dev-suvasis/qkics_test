import { useState } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";
import { GoPlus } from "react-icons/go";
import ModalOverlay from "../../components/ui/ModalOverlay";

export default function HonorsPage({
  honors_awards = [],
  setExpertData,
}) {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);
  const isDark = theme === "dark";

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const emptyForm = {
    title: "",
    issuer: "",
    issue_date: "",
    description: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const inputClass = `w-full bg-transparent border-b-2 font-medium focus:outline-none transition-all pb-2 ${isDark
    ? "border-white/20 focus:border-red-500 text-white placeholder-neutral-600"
    : "border-black/10 focus:border-red-500 text-black placeholder-neutral-400"
    }`;

  const labelClass = `block text-left text-xs font-black uppercase tracking-widest mb-3 ${isDark ? "text-neutral-500" : "text-neutral-400"}`;

  /* OPEN ADD MODAL */
  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setOpenModal(true);
  };

  /* OPEN EDIT MODAL */
  const openEditModal = (honor) => {
    setForm({ ...honor });
    setEditingId(honor.id);
    setOpenModal(true);
  };

  /* SAVE HONOR */
  const handleSubmit = async () => {
    try {
      const payload = {
        title: form.title,
        issuer: form.issuer,
        issue_date: form.issue_date,
        description: form.description,
      };

      let res;

      if (editingId) {
        // UPDATE
        res = await axiosSecure.patch(
          `/v1/experts/honors/${editingId}/`,
          payload
        );

        setExpertData((prev) => ({
          ...prev,
          honors_awards: (prev.honors_awards || []).map((h) =>
            h.id === editingId ? res.data : h
          ),
        }));

        showAlert("Honor updated successfully!", "success");
      } else {
        // CREATE
        res = await axiosSecure.post(`/v1/experts/honors/`, payload);

        setExpertData((prev) => ({
          ...prev,
          honors_awards: [...(prev.honors_awards || []), res.data],
        }));

        showAlert("Honor added successfully!", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Honor save failed:", err);
      showAlert("Failed to save honor!", "error");
    }
  };

  /* DELETE HONOR */
  const deleteHonor = async (id) => {
    showConfirm({
      title: "Delete Honor/Award?",
      message: "Are you sure you want to delete this honor?",
      confirmText: "Delete",
      cancelText: "Cancel",

      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/honors/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            honors_awards: (prev.honors_awards || []).filter(
              (h) => h.id !== id
            ),
          }));

          showAlert("Honor deleted successfully!", "success");
        } catch (err) {
          console.log("Delete failed:", err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  return (
    <div className={`premium-card p-8 md:p-12 ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <h2 className="text-xl font-black uppercase tracking-tight">Honors & Awards</h2>

        {!readOnly && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-600/20"
          >
            <GoPlus size={16} /> Add
          </button>
        )}
      </div>

      {/* HONORS LIST */}
      {!honors_awards || honors_awards.length === 0 ? (
        <div className={`text-center py-10 border border-dashed rounded-3xl ${isDark ? "border-white/10 text-neutral-500" : "border-black/10 text-neutral-400"}`}>
          <p className="font-medium">No honors added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {honors_awards.map((h) => (
            <div
              key={h.id}
              className={`relative group p-6 rounded-3xl border transition-all hover:shadow-lg ${isDark ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-neutral-50 border-black/5 hover:border-black/10"}`}
            >
              {/* Edit/Delete */}
              {!readOnly && (
                <div className="absolute top-4 right-4 flex gap-2 transition-opacity">
                  <button
                    onClick={() => openEditModal(h)}
                    className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/10 text-black"}`}
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    onClick={() => deleteHonor(h.id)}
                    className={`p-2 rounded-full transition-colors hover:bg-red-500/10 text-red-500`}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              )}

              {/* CONTENT */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{h.title}</h3>

                <p className="text-sm font-medium opacity-80">
                  {h.issuer || "Unknown Issuer"}
                </p>

                <p className="text-xs font-black uppercase tracking-widest opacity-50 mt-2">
                  Issued {h.issue_date}
                </p>

                {h.description && (
                  <p className="text-sm mt-4 leading-relaxed opacity-70 border-t border-white/5 pt-4">
                    {h.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {!readOnly && openModal && (
        <ModalOverlay close={() => setOpenModal(false)}>
          <div className={`w-full max-w-2xl p-8 rounded-3xl shadow-2xl relative ${isDark ? "bg-[#171717] border border-neutral-800" : "bg-white"}`}>

            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight text-left">
                {editingId ? "Edit" : "Add"} <span className="text-red-600">Honor</span>
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className={`text-2xl hover:text-red-500 transition-colors ${isDark ? "text-white" : "text-black"}`}
              >
                &times;
              </button>
            </div>

            <div className="grid gap-6">
              <div>
                <label className={labelClass}>
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Best Innovator"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Issuer</label>
                  <input
                    value={form.issuer}
                    onChange={(e) =>
                      setForm({ ...form, issuer: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. TechCrunch"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Issue Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) =>
                      setForm({ ...form, issue_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={`${inputClass} border rounded-xl p-3`}
                  placeholder="Describe the honor or award..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => setOpenModal(false)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "hover:bg-white/10" : "hover:bg-neutral-100"}`}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
              >
                {editingId ? "Save Changes" : "Add Honor"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
