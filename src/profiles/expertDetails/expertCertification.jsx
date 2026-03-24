import { useState } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useConfirm } from "../../context/ConfirmContext";
import { useAlert } from "../../context/AlertContext";
import { GoPlus } from "react-icons/go";
import ModalOverlay from "../../components/ui/ModalOverlay";

export default function CertificationPage({
  certifications = [],
  setExpertData,
}) {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);
  const isDark = theme === "dark";

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;
  const emptyForm = {
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiration_date: "",
    credential_id: "",
    credential_url: "",
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
  const openEditModal = (cert) => {
    setForm({ ...cert });
    setEditingId(cert.id);
    setOpenModal(true);
  };

  /* SAVE CERTIFICATION */
  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        expiration_date:
          form.expiration_date === "" ? null : form.expiration_date,
      };

      let res;

      if (editingId) {
        // UPDATE
        res = await axiosSecure.patch(
          `/v1/experts/certifications/${editingId}/`,
          payload
        );

        setExpertData((prev) => ({
          ...prev,
          certifications: prev.certifications.map((c) =>
            c.id === editingId ? res.data : c
          ),
        }));

        showAlert("Certification updated", "success");
      } else {
        // CREATE
        res = await axiosSecure.post(`/v1/experts/certifications/`, payload);

        setExpertData((prev) => ({
          ...prev,
          certifications: [...prev.certifications, res.data],
        }));

        showAlert("Certification added", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Certification save failed:", err);
    }
  };

  /* DELETE CERTIFICATION */
  const deleteCertification = async (id) => {
    showConfirm({
      title: "Delete certification?",
      message:
        "Are you sure you want to delete this certification? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",

      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/certifications/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            certifications: prev.certifications.filter((c) => c.id !== id),
          }));

          showAlert("Certification deleted successfully!", "success");
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
        <h2 className="text-xl font-black uppercase tracking-tight">Certifications</h2>

        {!readOnly && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-600/20"
          >
            <GoPlus size={16} /> Add
          </button>
        )}
      </div>

      {/* CERTIFICATIONS LIST */}
      {!certifications || certifications.length === 0 ? (
        <div className={`text-center py-10 border border-dashed rounded-3xl ${isDark ? "border-white/10 text-neutral-500" : "border-black/10 text-neutral-400"}`}>
          <p className="font-medium">No certifications added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className={`relative group p-6 rounded-3xl border transition-all hover:shadow-lg ${isDark ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-neutral-50 border-black/5 hover:border-black/10"}`}
            >
              {/* Edit/Delete icons */}
              {!readOnly && (
                <div className="absolute top-4 right-4 flex gap-2 transition-opacity">
                  <button
                    onClick={() => openEditModal(cert)}
                    className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/10 text-black"}`}
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    onClick={() => deleteCertification(cert.id)}
                    className={`p-2 rounded-full transition-colors hover:bg-red-500/10 text-red-500`}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              )}

              {/* CARD CONTENT */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{cert.name}</h3>

                <p className="text-sm font-medium opacity-80">
                  {cert.issuing_organization}
                </p>

                <p className="text-xs font-black uppercase tracking-widest opacity-50 mt-2">
                  Issued {cert.issue_date}
                  {cert.expiration_date
                    ? ` • Expires ${cert.expiration_date}`
                    : " • No Expiration"}
                </p>

                {cert.credential_id && (
                  <p className="text-sm opacity-70 mt-4">
                    Credential ID: {cert.credential_id}
                  </p>
                )}

                {cert.credential_url && (
                  <p className="text-sm mt-2">
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-600 hover:underline font-bold text-xs uppercase tracking-wider"
                    >
                      View Credential &rarr;
                    </a>
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
                {editingId ? "Edit" : "Add"} <span className="text-red-600">Certification</span>
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
                  Certification Name <span className="text-red-600">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. AWS Certified Solutions Architect"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Issuing Organization <span className="text-red-600">*</span>
                </label>
                <input
                  value={form.issuing_organization}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      issuing_organization: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="e.g. Amazon Web Services"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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

                <div>
                  <label className={labelClass}>Expiration Date</label>
                  <input
                    type="date"
                    value={form.expiration_date ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, expiration_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Credential ID</label>
                  <input
                    value={form.credential_id}
                    onChange={(e) =>
                      setForm({ ...form, credential_id: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Credential URL</label>
                  <input
                    value={form.credential_url}
                    onChange={(e) =>
                      setForm({ ...form, credential_url: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
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
                {editingId ? "Save Changes" : "Add Certification"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
