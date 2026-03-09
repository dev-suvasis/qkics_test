import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaCheckCircle, FaCrown, FaArrowRight } from "react-icons/fa";
import { MdDiamond } from "react-icons/md";

import axiosSecure from "../utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";

export default function Subscription() {
    const navigate = useNavigate();
    const { theme, data: user } = useSelector((state) => state.user);
    const isDark = theme === "dark";
    const { showAlert } = useAlert();

    const [plans, setPlans] = useState([]);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(null); // stores uuid of plan being subscribed to

    // Theme Colors
    const bg = isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]";
    const text = isDark ? "text-white" : "text-black";
    const muted = isDark ? "text-neutral-400" : "text-neutral-500";
    const cardBg = isDark ? "bg-neutral-900/50" : "bg-white/70";
    const border = isDark ? "border-white/5" : "border-black/5";

    useEffect(() => {
        const loadInit = async () => {
            setLoading(true);
            await Promise.all([fetchPlans(), fetchActiveSubscription()]);
            setLoading(false);
        };
        loadInit();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await axiosSecure.get("/v1/subscriptions/plans/");
            setPlans(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (err) {
            console.error("Failed to load plans", err);
        }
    };

    const fetchActiveSubscription = async () => {
        if (!user) return;
        try {
            const res = await axiosSecure.get("/v1/subscriptions/me/");
            const subData = res.data;
            if (subData && subData.is_active) {
                const now = new Date();
                const start = new Date(subData.start_date);
                const end = new Date(subData.end_date);
                if (now >= start && now <= end) {
                    setActiveSubscription(subData);
                }
            }
        } catch (err) {
            console.error("Failed to load active subscription", err);
        }
    };

    const handleSubscribe = async (plan) => {
        if (!user) {
            showAlert("Please login to subscribe", "error");
            return;
        }

        try {
            setSubscribing(plan.uuid);
            const res = await axiosSecure.post("/v1/subscriptions/subscribe/", {
                plan_uuid: plan.uuid
            });

            console.log("✅ Subscription successful:", res.data);
            showAlert(`Successfully subscribed to ${plan.name} plan!`, "success");

            // Navigate to profile or refresh page to show active status
            setTimeout(() => {
                navigate("/profile");
            }, 1000);

        } catch (err) {
            console.error("❌ Subscription failed:", err);
            const errMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to subscribe. Please try again.";
            showAlert(errMsg, "error");
        } finally {
            setSubscribing(null);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bg}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ${text}`}>Loading Plans...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

                {/* HEADER */}
                <div className="text-center mb-12 animate-fadeIn">
                    <h1 className={`text-4xl md:text-6xl font-black tracking-tighter mb-6 ${text}`}>
                        Upgrade your <span className="text-red-600">Impact</span>
                    </h1>
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${muted}`}>
                        Unlock exclusive access to expert intelligence, premium resources, and advanced networking tools.
                    </p>
                </div>

                {/* ACTIVE SUBSCRIPTION */}
                {activeSubscription && (
                    <div className={`mb-12 max-w-2xl mx-auto p-6 rounded-[2.5rem] border ${border} ${cardBg} backdrop-blur-xl animate-scaleIn relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MdDiamond size={120} />
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-red-600/10 flex items-center justify-center text-red-600">
                                <FaCrown size={32} />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <h3 className={`text-xl font-black uppercase tracking-tight ${text}`}>Active Subscription</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
                                </div>
                                <p className={`text-sm font-bold ${muted}`}>
                                    Plan: <span className={text}>{activeSubscription.plan_name || "Premium Plan"}</span>
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">
                                    Expires: {new Date(activeSubscription.end_date).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRICING GRID */}
                {plans.length === 0 ? (
                    <div className={`text-center py-20 rounded-3xl border ${border} ${cardBg} backdrop-blur-xl`}>
                        <MdDiamond className="mx-auto text-5xl mb-4 text-neutral-300 dark:text-neutral-700" />
                        <h3 className={`font-bold text-xl ${text}`}>No Plans Available</h3>
                        <p className={`text-sm ${muted} mt-2`}>Please check back later for new subscription offers.</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center mt-12 gap-6 md:gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, index) => {
                            const isRecommended = index === 1; // Assuming middle plan is recommended for visual balance
                            const isActivePlan = activeSubscription?.plan_uuid === plan.uuid;

                            return (
                                <div
                                    key={plan.uuid}
                                    className={`relative group flex flex-col p-6 w-full max-w-[300px] rounded-3xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-xl
                                         ${isDark
                                            ? "bg-neutral-900 border-neutral-800 hover:border-red-600/30"
                                            : "bg-white border-neutral-100 hover:border-red-600/20 hover:shadow-red-600/5"}
                                         ${isActivePlan ? "ring-2 ring-red-600" : ""}
                                      `}
                                >
                                    {(isRecommended || isActivePlan) && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-600/40 z-10">
                                            {isActivePlan ? "Current Plan" : "Most Popular"}
                                        </div>
                                    )}

                                    {/* CARD HEADER */}
                                    <div className="mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl
                                             ${isDark ? "bg-neutral-800 text-white" : "bg-neutral-50 text-black"}
                                             group-hover:scale-110 transition-transform duration-500
                                             ${isActivePlan ? "bg-red-600/10 text-red-600" : ""}
                                           `}>
                                            <FaCrown className={isRecommended || isActivePlan ? "text-red-600" : "opacity-30"} />
                                        </div>
                                        <h3 className={`text-xl font-black uppercase tracking-tight mb-1 ${text}`}>
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-3xl font-extrabold ${text}`}>₹{plan.price}</span>
                                            <span className={`text-xs font-medium ${muted}`}>/ {plan.duration_days} days</span>
                                        </div>
                                    </div>

                                    {/* FEATURES LIST (Placeholder if no features in API) */}
                                    <div className="flex-1 space-y-4 mb-6">
                                        <div className={`w-full h-px ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`} />
                                        <ul className="space-y-3">
                                            {['Premium Support', 'Unlimited Access', 'Expert Consultation', 'Verified Badge'].map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <FaCheckCircle className="text-red-600 flex-shrink-0" size={14} />
                                                    <span className={`text-xs font-bold ${muted}`}>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* ACTION BUTTON */}
                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={subscribing !== null || isActivePlan}
                                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-all
                                             ${subscribing === plan.uuid || isActivePlan ? "opacity-50 cursor-not-allowed" : ""}
                                             ${isActivePlan
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                                : isRecommended
                                                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-700 hover:scale-[1.02]"
                                                    : `${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"}`
                                            }
                                         `}
                                    >
                                        {subscribing === plan.uuid ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                <span>Subscribing...</span>
                                            </div>
                                        ) : isActivePlan ? (
                                            <div className="flex items-center gap-2">
                                                <FaCheckCircle size={12} />
                                                <span>Active</span>
                                            </div>
                                        ) : (
                                            <>Get Started <FaArrowRight size={12} /></>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
