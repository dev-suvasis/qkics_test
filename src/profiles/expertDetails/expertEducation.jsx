import { useState } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useConfirm } from "../../context/ConfirmContext";
import { useAlert } from "../../context/AlertContext";
import { GoPlus } from "react-icons/go";
import ModalOverlay from "../../components/ui/ModalOverlay";

export default function EducationPage({
  education = [],
  setExpertData,
}) {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);
  const isDark = theme === "dark";

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;
  const emptyForm = {
    school: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: "",
    grade: "",
    description: "",
  };

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

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
  const openEditModal = (edu) => {
    setForm({ ...edu });
    setEditingId(edu.id);
    setOpenModal(true);
  };

  /* SAVE EDUCATION */
  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        end_year: form.end_year ? Number(form.end_year) : null,
        start_year: form.start_year ? Number(form.start_year) : null,
      };

      let res;

      if (editingId) {
        // UPDATE
        res = await axiosSecure.patch(
          `/v1/experts/education/${editingId}/`,
          payload
        );

        setExpertData((prev) => ({
          ...prev,
          educations: prev.educations.map((e) =>
            e.id === editingId ? res.data : e
          ),
        }));

        showAlert("Education updated", "success");
      } else {
        // CREATE
        res = await axiosSecure.post(`/v1/experts/education/`, payload);

        setExpertData((prev) => ({
          ...prev,
          educations: [...prev.educations, res.data],
        }));

        showAlert("Education added", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Education save failed:", err);
    }
  };

  /* DELETE EDUCATION */
  const deleteEducation = async (id) => {
    showConfirm({
      title: "Delete education?",
      message:
        "Are you sure you want to delete this education? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",

      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/education/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            educations: prev.educations.filter((c) => c.id !== id),
          }));

          showAlert("Education deleted successfully!", "success");
        } catch (err) {
          console.log("Delete error:", err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  return (
    <div className={`premium-card p-8 md:p-12 ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      {/* HEADING + ADD BUTTON */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <h2 className="text-xl font-black uppercase tracking-tight">Education</h2>

        {!readOnly && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-600/20"
          >
            <GoPlus size={16} /> Add
          </button>
        )}
      </div>

      {/* EDUCATION LIST */}
      {!education || education.length === 0 ? (
        <div className={`text-center py-10 border border-dashed rounded-3xl ${isDark ? "border-white/10 text-neutral-500" : "border-black/10 text-neutral-400"}`}>
          <p className="font-medium">No education added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu) => (
            <div
              key={edu.id}
              className={`relative group p-6 rounded-3xl border transition-all hover:shadow-lg ${isDark ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-neutral-50 border-black/5 hover:border-black/10"}`}
            >
              {/* Edit/Delete icons */}
              {!readOnly && (
                <div className="absolute top-4 right-4 flex gap-2 transition-opacity">
                  <button
                    onClick={() => openEditModal(edu)}
                    className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/10 text-black"}`}
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    onClick={() => deleteEducation(edu.id)}
                    className={`p-2 rounded-full transition-colors hover:bg-red-500/10 text-red-500`}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              )}

              {/* CARD CONTENT */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{edu.school}</h3>

                <p className="text-sm font-medium opacity-80">
                  {edu.degree}
                  {edu.field_of_study ? ` • ${edu.field_of_study}` : ""}
                </p>

                <p className="text-xs font-black uppercase tracking-widest opacity-50 mt-2">
                  {edu.start_year} — {edu.end_year ? edu.end_year : "Present"}
                  {edu.grade ? ` • Grade: ${edu.grade}` : ""}
                </p>

                {edu.description && (
                  <p className="text-sm mt-4 leading-relaxed opacity-70 border-t border-white/5 pt-4">
                    {edu.description}
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
                {editingId ? "Edit" : "Add"} <span className="text-red-600">Education</span>
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
                <label className={labelClass}>Institute <span className="text-red-600">*</span></label>
                <input
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Stanford University"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Degree <span className="text-red-600">*</span></label>
                  <input
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Bachelor's"
                  />
                </div>
                <div>
                  <label className={labelClass}>Field of Study <span className="text-red-600">*</span></label>
                  <input
                    value={form.field_of_study}
                    onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>


              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Start Year <span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    value={form.start_year}
                    onChange={(e) => setForm({ ...form, start_year: e.target.value })}
                    className={inputClass}
                    placeholder="YYYY"
                  />
                </div>
                <div>
                  <label className={labelClass}>End Year</label>
                  <input
                    type="number"
                    value={form.end_year ?? ""}
                    onChange={(e) => setForm({ ...form, end_year: e.target.value })}
                    className={inputClass}
                    placeholder="YYYY"
                  />
                </div>
                <div>
                  <label className={labelClass}>Grade <span className="text-red-600">*</span></label>
                  <input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. 3.8 GPA"
                  />
                </div>
              </div>


              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputClass} border rounded-xl p-3`}
                  placeholder="Activities and societies..."
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
                {editingId ? "Save Changes" : "Add Education"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
