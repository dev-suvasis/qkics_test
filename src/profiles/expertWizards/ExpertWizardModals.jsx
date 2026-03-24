// src/profiles/expert/ExpertWizardModals.jsx
import React, { useState } from "react";

/* ============================================================
   EXPORTS
============================================================ */
export {
  AddExperienceModal,
  AddEducationModal,
  AddCertificationModal,
  AddHonorModal,
  SubmitNoteModal,
  ModalOverlay,
};

/* ============================================================
   MODAL OVERLAY WRAPPER
============================================================ */
function ModalOverlay({ children, isDark, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${isDark ? "bg-neutral-900 border border-white/10 text-white" : "bg-white text-black"}
          rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-2xl p-8 md:p-12 overflow-y-auto max-h-[90vh]`}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   REUSABLE INPUT FIELD
============================================================ */
function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  isDark
}) {
  const inputClass = (enabled) =>
    `w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium ${isDark
      ? enabled
        ? "border-red-600 text-white placeholder-white/30"
        : "border-white/10 text-white/50"
      : enabled
        ? "border-red-600 text-black placeholder-black/30"
        : "border-black/10 text-black/50"
    }`;

  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 block";

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(!disabled)}
      />
    </div>
  );
}

/* ============================================================
   ADD EXPERIENCE MODAL
============================================================ */
function AddExperienceModal({ onClose, onCreate, isDark }) {
  const [form, setForm] = useState({
    job_title: "",
    company: "",
    employment_type: "full_time",
    location: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.job_title || !form.company || !form.start_date) {
      alert("Please fill job title, company and start date.");
      return;
    }
    setSaving(true);
    try {
      // ✅ Sanitize: Convert empty date strings to null for backend Compatibility
      const payload = {
        ...form,
        end_date: form.end_date || null,
        start_date: form.start_date || null,
      };
      await onCreate(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Add Experience</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Input
          label="Job Title"
          value={form.job_title}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, job_title: v }))}
        />

        <Input
          label="Company"
          value={form.company}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, company: v }))}
        />

        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 block">Employment Type</label>
          <select
            className={`w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium ${isDark ? "border-white/10 text-white bg-neutral-900" : "border-black/10 text-black bg-white"}`}
            value={form.employment_type}
            onChange={(e) =>
              setForm((p) => ({ ...p, employment_type: e.target.value }))
            }
          >
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <Input
          label="Location"
          value={form.location}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, location: v }))}
        />

        <Input
          label="Start Date"
          type="date"
          isDark={isDark}
          value={form.start_date}
          onChange={(v) => setForm((p) => ({ ...p, start_date: v }))}
        />

        <Input
          label="End Date"
          type="date"
          isDark={isDark}
          value={form.end_date}
          onChange={(v) => setForm((p) => ({ ...p, end_date: v }))}
        />

        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 block">Description</label>
          <textarea
            className={`w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium resize-none ${isDark ? "border-white/10 text-white" : "border-black/10 text-black"}`}
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          {saving ? "Adding..." : "Add Experience"}
        </button>
        <button
          onClick={onClose}
          className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"}`}
        >
          Cancel
        </button>
      </div>
    </>
  );
}


/* ============================================================
   ADD EDUCATION MODAL
============================================================ */
function AddEducationModal({ onClose, onCreate, isDark }) {
  const [form, setForm] = useState({
    school: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: "",
    grade: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.school || !form.degree) {
      alert("School and Degree are required.");
      return;
    }
    setSaving(true);
    try {
      await onCreate(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Add Education</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Input
          label="Institute"
          value={form.school}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, school: v }))}
        />

        <Input
          label="Degree"
          value={form.degree}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, degree: v }))}
        />

        <Input
          label="Field of Study"
          value={form.field_of_study}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, field_of_study: v }))}
        />

        <Input
          label="Start Year"
          type="number"
          value={form.start_year}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, start_year: v }))}
        />

        <Input
          label="End Year"
          type="number"
          value={form.end_year}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, end_year: v }))}
        />

        <Input
          label="Grade"
          value={form.grade}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, grade: v }))}
        />

        {/* Description */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 block">Description</label>
          <textarea
            className={`w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium resize-none ${isDark ? "border-white/10 text-white" : "border-black/10 text-black"}`}
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          {saving ? "Adding..." : "Add Education"}
        </button>
        <button
          onClick={onClose}
          className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"}`}
        >
          Cancel
        </button>
      </div>
    </>
  );
}


/* ============================================================
   ADD CERTIFICATION MODAL
============================================================ */
function AddCertificationModal({ onClose, onCreate, isDark }) {
  const [form, setForm] = useState({
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiration_date: "",
    credential_id: "",
    credential_url: "",
  });

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name || !form.issuing_organization) {
      alert("Name and Issuing Organization are required.");
      return;
    }
    setSaving(true);
    try {
      // ✅ Sanitize dates: Convert empty strings to null for backend Compatibility
      const payload = {
        ...form,
        issue_date: form.issue_date || null,
        expiration_date: form.expiration_date || null,
      };
      await onCreate(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Add Certification</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          value={form.name}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, name: v }))}
        />

        <Input
          label="Issuing Organization"
          value={form.issuing_organization}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, issuing_organization: v }))}
        />

        <Input
          label="Issue Date"
          type="date"
          isDark={isDark}
          value={form.issue_date}
          onChange={(v) => setForm((p) => ({ ...p, issue_date: v }))}
        />

        <Input
          label="Expiration Date"
          type="date"
          isDark={isDark}
          value={form.expiration_date}
          onChange={(v) => setForm((p) => ({ ...p, expiration_date: v }))}
        />

        <Input
          label="Credential ID"
          value={form.credential_id}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, credential_id: v }))}
        />

        <Input
          label="Credential URL"
          value={form.credential_url}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, credential_url: v }))}
        />
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          {saving ? "Adding..." : "Add Certification"}
        </button>
        <button
          onClick={onClose}
          className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"}`}
        >
          Cancel
        </button>
      </div>
    </>
  );
}


/* ============================================================
   ADD HONOR / AWARD MODAL
============================================================ */
function AddHonorModal({ onClose, onCreate, isDark }) {
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    issue_date: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title || !form.issuer) {
      alert("Title and Issuer are required.");
      return;
    }
    setSaving(true);
    try {
      // ✅ Sanitize date
      const payload = {
        ...form,
        issue_date: form.issue_date || null,
      };
      await onCreate(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Add Honor / Award</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Title"
          value={form.title}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, title: v }))}
        />

        <Input
          label="Issuer"
          value={form.issuer}
          isDark={isDark}
          onChange={(v) => setForm((p) => ({ ...p, issuer: v }))}
        />

        <Input
          label="Issue Date"
          type="date"
          isDark={isDark}
          value={form.issue_date}
          onChange={(v) => setForm((p) => ({ ...p, issue_date: v }))}
        />

        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 block">Description</label>
          <textarea
            className={`w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium resize-none ${isDark ? "border-white/10 text-white" : "border-black/10 text-black"}`}
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          {saving ? "Adding..." : "Add Honor"}
        </button>
        <button
          onClick={onClose}
          className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"}`}
        >
          Cancel
        </button>
      </div>
    </>
  );
}


/* ============================================================
   SUBMIT NOTE MODAL (Before submitting for review)
============================================================ */
function SubmitNoteModal({ onClose, onSubmit, isDark }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await onSubmit(note);
      onClose();
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Submit Application for Verification</h2>

      <div className="mb-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 block">
          Admin Review Note (optional)
        </label>
        <textarea
          className={`w-full mt-2 px-3 py-2 rounded-xl border-2 outline-none transition-all font-medium resize-none ${isDark ? "bg-white/5 border-white/10 text-white focus:border-red-600" : "bg-neutral-50 border-black/10 text-black focus:border-red-600"
            }`}
          rows={4}
          placeholder="Write any important information for the admin..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={submit}
          disabled={sending}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          {sending ? "Submitting..." : "Submit Application"}
        </button>

        <button
          onClick={onClose}
          className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"
            }`}
        >
          Cancel
        </button>
      </div>
    </>
  );
}
