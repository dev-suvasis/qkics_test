import { useState } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useConfirm } from "../../context/ConfirmContext";
import { useAlert } from "../../context/AlertContext";
import { GoPlus } from "react-icons/go";
import ModalOverlay from "../../components/ui/ModalOverlay";

export default function ExperiencePage({
  experiences = [],
  setExpertData,
}) {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);
  const isDark = theme === "dark";

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const emptyForm = {
    job_title: "",
    company: "",
    employment_type: "",
    location: "",
    start_date: "",
    end_date: "",
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
  const openEditModal = (exp) => {
    setEditingId(exp.id);
    setForm({ ...exp });
    setOpenModal(true);
  };

  /* SAVE EXPERIENCE (ADD OR UPDATE) */
  const handleSubmit = async () => {
    try {
      const payload = {
        job_title: form.job_title,
        company: form.company,
        employment_type: form.employment_type,
        location: form.location,
        start_date: form.start_date,
        end_date:
          form.end_date === "" ||
            form.end_date === null ||
            form.end_date === undefined
            ? null
            : form.end_date,
        description: form.description,
      };

      let res;

      if (editingId) {
        // UPDATE
        res = await axiosSecure.patch(
          `/v1/experts/experience/${editingId}/`,
          payload
        );

        setExpertData((prev) => ({
          ...prev,
          experiences: prev.experiences.map((exp) =>
            exp.id === editingId ? res.data : exp
          ),
        }));

        showAlert("Experience updated successfully!", "success");
      } else {
        // CREATE
        res = await axiosSecure.post(`/v1/experts/experience/`, payload);

        setExpertData((prev) => ({
          ...prev,
          experiences: [...prev.experiences, res.data],
        }));

        showAlert("Experience added successfully!", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Experience save failed:", err);
    }
  };

  /* DELETE EXPERIENCE */
  const deleteExperience = async (id) => {
    showConfirm({
      title: "Delete experience?",
      message:
        "Are you sure you want to delete this experience? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",

      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/experience/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            experiences: prev.experiences.filter((c) => c.id !== id),
          }));

          showAlert("Experience deleted successfully!", "success");
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
        <h2 className="text-xl font-black uppercase tracking-tight">Experience</h2>

        {!readOnly && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-600/20"
          >
            <GoPlus size={16} /> Add
          </button>
        )}
      </div>

      {experiences.length === 0 ? (
        <div className={`text-center py-10 border border-dashed rounded-3xl ${isDark ? "border-white/10 text-neutral-500" : "border-black/10 text-neutral-400"}`}>
          <p className="font-medium">No experience added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className={`relative group p-6 rounded-3xl border transition-all hover:shadow-lg ${isDark ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-neutral-50 border-black/5 hover:border-black/10"}`}
            >
              {/* Edit/Delete icons */}
              {!readOnly && (
                <div className="absolute top-4 right-4 flex gap-2 transition-opacity">
                  <button
                    onClick={() => openEditModal(exp)}
                    className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/10 text-black"}`}
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    onClick={() => deleteExperience(exp.id)}
                    className={`p-2 rounded-full transition-colors hover:bg-red-500/10 text-red-500`}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-lg font-bold">{exp.job_title}</h3>

                <p className="text-sm font-medium opacity-80">
                  {exp.company}
                  {exp.location ? ` • ${exp.location}` : ""}
                </p>

                <p className="text-xs font-black uppercase tracking-widest opacity-50 mt-2">
                  {exp.employment_type.replace("_", " ")} •{" "}
                  {exp.start_date} — {exp.end_date ? exp.end_date : "Present"}
                </p>

                {exp.description && (
                  <p className="text-sm mt-4 leading-relaxed opacity-70 border-t border-white/5 pt-4">
                    {exp.description}
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
                {editingId ? "Edit" : "Add"} <span className="text-red-600">Experience</span>
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className={`text-2xl hover:text-red-500 transition-colors ${isDark ? "text-white" : "text-black"}`}
              >
                &times;
              </button>
            </div>

            <div className="grid gap-6">

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Job Title <span className="text-red-600">*</span></label>
                  <input
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div>
                  <label className={labelClass}>Company <span className="text-red-600">*</span></label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Google"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Location <span className="text-red-600">*</span></label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. New York, USA"
                  />
                </div>
                <div>
                  <label className={labelClass}>Employment Type <span className="text-red-600">*</span></label>
                  <select
                    value={form.employment_type}
                    onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="" className="text-black">Select Type</option>
                    <option value="full_time" className="text-black">Full Time</option>
                    <option value="part_time" className="text-black">Part Time</option>
                    <option value="contract" className="text-black">Contract</option>
                    <option value="internship" className="text-black">Internship</option>
                    <option value="freelance" className="text-black">Freelance</option>
                  </select>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Start Date <span className="text-red-600">*</span></label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>End Date</label>
                  <input
                    type="date"
                    value={form.end_date ?? ""}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputClass} border rounded-xl p-3`}
                  placeholder="Describe your role and achievements..."
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
                {editingId ? "Save Changes" : "Add Experience"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
