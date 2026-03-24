// src/profiles/expert/ExpertWizard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

import Steps from "./ExpertWizardSteps";
import {
    AddExperienceModal,
    AddEducationModal,
    AddCertificationModal,
    AddHonorModal,
    SubmitNoteModal,
    ModalOverlay,
} from "./ExpertWizardModals";

export default function ExpertWizard({ theme }) {
    const isDark = theme === "dark";
    const navigate = useNavigate();

    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();

    const [step, setStep] = useState(1);

    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        headline: "",
        primary_expertise: "",
        other_expertise: "",
        hourly_rate: 1000,
        is_available: true,
    });

    const [profileMeta, setProfileMeta] = useState(null);

    const [experiences, setExperiences] = useState([]);
    const [educations, setEducations] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [honors, setHonors] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [showAddModal, setShowAddModal] = useState(null);
    const [showSubmitNoteModal, setShowSubmitNoteModal] = useState(false);

    const [hideBanner, setHideBanner] = useState(false);

    /* ------------------------------
       FETCH PROFILE ON MOUNT
    ------------------------------ */
    useEffect(() => {
        let mounted = true;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await axiosSecure.get("/v1/experts/me/profile/");
                if (!mounted) return;
                const data = res.data;

                setProfileMeta(data);

                setProfile({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    headline: data.headline || "",
                    primary_expertise: data.primary_expertise || "",
                    other_expertise: data.other_expertise || "",
                    hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : 1000,
                    is_available: data.is_available ?? true,
                });

                setExperiences(data.experiences || []);
                setEducations(data.educations || []);
                setCertifications(data.certifications || []);
                setHonors(data.honors_awards || []);
            } catch (err) {
                console.debug("Profile not found:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchProfile();
        return () => { mounted = false };
    }, []);

    /* ------------------------------
       SCROLL FIX — ALWAYS GO TOP
    ------------------------------ */
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    /* ------------------------------
       STATUS DERIVED FLAGS
    ------------------------------ */
    const applicationStatus = profileMeta?.application_status || "draft";
    const isVerified = profileMeta?.verified_by_admin === true;

    // OPTION A — user can edit even in pending mode
    const isEditable = applicationStatus !== "approved";

    const banner = (() => {
        if (!profileMeta) return null;

        const note = profileMeta.admin_review_note || "";
        const status = applicationStatus;

        if (status === "approved" && isVerified) {
            return {
                text: "🎉 Your expert profile has been approved! Please logout and login again to activate expert features.",
                tone: "success"
            };
        }
        if (status === "pending") {
            return {
                text: "⏳ Your application is under review. You may edit your profile but cannot resubmit.",
                tone: "info"
            };
        }
        if (status === "rejected") {
            return {
                text: `❌ Your application was rejected. ${note ? "Admin note: " + note : ""}`,
                tone: "error"
            };
        }
        return null;
    })();

    /* ------------------------------
       VALIDATION
    ------------------------------ */
    const validateProfile = () => {
        const errors = [];
        if (!profile.first_name?.trim()) errors.push("First name is required");
        if (!profile.headline?.trim()) errors.push("Headline is required");
        if (!profile.primary_expertise?.trim())
            errors.push("Primary expertise is required");
        if (!profile.hourly_rate || Number(profile.hourly_rate) <= 0)
            errors.push("Hourly rate must be a positive number");
        return errors;
    };

    /* ------------------------------
       SAVE PROFILE
    ------------------------------ */
    const handleSaveProfile = async () => {
        const errors = validateProfile();
        if (errors.length) {
            showAlert(errors.join(". "), "error");
            return;
        }

        setSaving(true);
        try {
            if (profileMeta?.id) {
                const res = await axiosSecure.put("/v1/experts/me/profile/", { ...profile });
                setProfileMeta(res.data);
                showAlert("Profile updated.", "success");
            } else {
                const res = await axiosSecure.post("/v1/experts/me/profile/", { ...profile });
                setProfileMeta(res.data);
                showAlert("Profile created.", "success");
            }
        } catch (err) {
            console.error(err);
            showAlert("Failed to save profile", "error");
        } finally {
            setSaving(false);
        }
    };

    /* ------------------------------
       SUBMIT FOR REVIEW
    ------------------------------ */
    const handleSubmitForReview = async (note = "") => {

        // Prevent pending resubmission
        if (applicationStatus === "pending") {
            showAlert("Your application is already under review.", "error");
            return;
        }

        // Prevent approved resubmission
        if (applicationStatus === "approved") {
            showAlert("You are already approved!", "success");
            return;
        }

        if (!profileMeta?.id) {
            showAlert("Please save your profile before submitting.", "error");
            return;
        }

        const errors = validateProfile();
        if (errors.length) {
            showAlert(errors.join(". "), "error");
            setStep(1);
            return;
        }

        setSubmitting(true);
        try {
            await axiosSecure.post("/v1/experts/me/submit/", { note });

            setProfileMeta((p) => ({
                ...(p || {}),
                application_status: "pending",
                admin_review_note: note,
            }));

            showAlert("Application submitted for review.", "success");
            setShowSubmitNoteModal(false);
            setStep(3);
        } catch (err) {
            console.error(err);
            showAlert("Submit failed.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ------------------------------
       CREATE CREDENTIAL ITEMS
    ------------------------------ */
    const handleApiError = (err, fallback) => {
        console.error(err);
        const data = err.response?.data;
        if (data && typeof data === 'object') {
            const msgs = Object.entries(data).map(([k, v]) => {
                const val = Array.isArray(v) ? v.join(", ") : v;
                return `${k}: ${val}`;
            }).join(" | ");
            showAlert(msgs || fallback, "error");
        } else {
            showAlert(fallback, "error");
        }
        throw err;
    };

    const createExperience = async (payload) => {
        try {
            const res = await axiosSecure.post("/v1/experts/experience/", payload);
            setExperiences((p) => [res.data, ...p]);
            showAlert("Experience added", "success");
        } catch (err) {
            handleApiError(err, "Failed to add experience");
        }
    };

    const createEducation = async (payload) => {
        try {
            const res = await axiosSecure.post("/v1/experts/education/", payload);
            setEducations((p) => [res.data, ...p]);
            showAlert("Education added", "success");
        } catch (err) {
            handleApiError(err, "Failed to add education");
        }
    };

    const createCertification = async (payload) => {
        try {
            const res = await axiosSecure.post("/v1/experts/certifications/", payload);
            setCertifications((p) => [res.data, ...p]);
            showAlert("Certification added", "success");
        } catch (err) {
            handleApiError(err, "Failed to add certification");
        }
    };

    const createHonor = async (payload) => {
        try {
            const res = await axiosSecure.post("/v1/experts/honors/", payload);
            setHonors((p) => [res.data, ...p]);
            showAlert("Honor added", "success");
        } catch (err) {
            handleApiError(err, "Failed to add honor");
        }
    };

    const handleStartOver = () => {
        setStep(1);
    };

    /* ------------------------------
       WIZARD NAVIGATION
    ------------------------------ */
    const next = () => setStep((s) => Math.min(3, s + 1));
    const prev = () => setStep((s) => Math.max(1, s - 1));
    const goTo = (s) => setStep(s);

    /* ------------------------------
       RENDER
    ------------------------------ */
    return (
        <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f]" : "bg-[#f5f5f5]"} pb-16`}>
            <div className="max-w-5xl mx-auto px-4 pt-12">

                {/* HEADER */}
                <div className={`p-6 rounded-xl shadow mb-6 ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"}`}>
                    <div className="flex items-start gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Expert Setup Wizard</h1>
                            <p className="text-sm opacity-70 mt-1">
                                Build your expert profile, add credentials, and submit for admin verification.
                            </p>
                        </div>

                        <div className="ml-auto text-right">
                            <div className="text-sm opacity-80">Step {step} of 3</div>
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-md border">Back</button>
                                <button onClick={handleStartOver} className="px-3 py-1 rounded-md border">Start Over</button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* BANNER */}
                {banner && !hideBanner && (
                    <div className="mb-6 relative">
                        <div
                            className={`p-3 rounded-md pr-10 ${banner.tone === "info"
                                    ? "bg-blue-50 text-blue-800"
                                    : banner.tone === "success"
                                        ? "bg-green-50 text-green-800"
                                        : "bg-red-50 text-red-800"
                                }`}
                        >
                            {banner.text}
                            <button
                                onClick={() => setHideBanner(true)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold opacity-60 hover:opacity-100"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* STEPS */}
                <Steps
                    step={step}
                    setStep={setStep}
                    next={next}
                    prev={prev}
                    goTo={goTo}
                    profile={profile}
                    setProfile={setProfile}
                    profileMeta={profileMeta}
                    isEditable={isEditable}
                    isVerified={isVerified}
                    experiences={experiences}
                    educations={educations}
                    certifications={certifications}
                    honors={honors}
                    handleSaveProfile={handleSaveProfile}
                    setShowAddModal={setShowAddModal}
                    setShowSubmitNoteModal={setShowSubmitNoteModal}
                    saving={saving}
                    submitting={submitting}
                    isDark={isDark}
                    applicationStatus={applicationStatus}
                />

                {/* MODALS */}
                {showAddModal === "experience" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddExperienceModal onClose={() => setShowAddModal(null)} onCreate={createExperience} isDark={isDark} />
                    </ModalOverlay>
                )}

                {showAddModal === "education" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddEducationModal onClose={() => setShowAddModal(null)} onCreate={createEducation} isDark={isDark} />
                    </ModalOverlay>
                )}

                {showAddModal === "cert" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddCertificationModal onClose={() => setShowAddModal(null)} onCreate={createCertification} isDark={isDark} />
                    </ModalOverlay>
                )}

                {showAddModal === "honor" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddHonorModal onClose={() => setShowAddModal(null)} onCreate={createHonor} isDark={isDark} />
                    </ModalOverlay>
                )}

                {showSubmitNoteModal && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowSubmitNoteModal(false)}>
                        <SubmitNoteModal
                            onClose={() => setShowSubmitNoteModal(false)}
                            onSubmit={handleSubmitForReview}
                            isDark={isDark}
                        />
                    </ModalOverlay>
                )}

            </div>
        </div>
    );
}
