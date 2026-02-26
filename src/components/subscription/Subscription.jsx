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
    const [loading, setLoading] = useState(true);

    // Theme Colors
    const bg = isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]";
    const text = isDark ? "text-white" : "text-black";
    const muted = isDark ? "text-neutral-400" : "text-neutral-500";
    const cardBg = isDark ? "bg-neutral-900/50" : "bg-white/70";
    const border = isDark ? "border-white/5" : "border-black/5";

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            // Assuming public endpoint. If fails, we might need to adjust based on backend routes.
            // Admin uses /v1/subscriptions/admin/plans/
            const res = await axiosSecure.get("/v1/subscriptions/plans/");
            const data = res.data;
            setPlans(Array.isArray(data) ? data : (data?.results || []));
        } catch (err) {
            console.error("Failed to load plans", err);
            // Fallback or empty state handled in UI
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = (plan) => {
        if (!user) {
            showAlert("Please login to subscribe", "error");
            return;
        }
        // Navigate to payment with plan details
        navigate("/payment", { state: { plan } });
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
                <div className="text-center mb- animate-fadeIn">
                    <h1 className={`text-4xl md:text-6xl font-black tracking-tighter mb-6 ${text}`}>
                        Upgrade your <span className="text-red-600">Impact</span>
                    </h1>
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${muted}`}>
                        Unlock exclusive access to expert intelligence, premium resources, and advanced networking tools.
                    </p>
                </div>

                {/* PRICING GRID */}
                {plans.length === 0 ? (
                    <div className={`text-center py-20 rounded-3xl border ${border} ${cardBg} backdrop-blur-xl`}>
                        <MdDiamond className="mx-auto text-5xl mb-4 text-neutral-300 dark:text-neutral-700" />
                        <h3 className={`font-bold text-xl ${text}`}>No Plans Available</h3>
                        <p className={`text-sm ${muted} mt-2`}>Please check back later for new subscription offers.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 mt-12 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.map((plan, index) => {
                            const isRecommended = index === 1; // Assuming middle plan is recommended for visual balance

                            return (
                                <div
                                    key={plan.uuid}
                                    className={`relative group flex flex-col p-8 rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl
                    ${isDark
                                            ? "bg-neutral-900 border-neutral-800 hover:border-red-600/30"
                                            : "bg-white border-neutral-100 hover:border-red-600/20 hover:shadow-red-600/5"}
                  `}
                                >
                                    {isRecommended && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-600/40">
                                            Most Popular
                                        </div>
                                    )}

                                    {/* CARD HEADER */}
                                    <div className="mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-2xl
                      ${isDark ? "bg-neutral-800 text-white" : "bg-neutral-50 text-black"}
                      group-hover:scale-110 transition-transform duration-500
                    `}>
                                            <FaCrown className={isRecommended ? "text-red-600" : "opacity-30"} />
                                        </div>
                                        <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${text}`}>
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-4xl font-extrabold ${text}`}>₹{plan.price}</span>
                                            <span className={`text-sm font-medium ${muted}`}>/ {plan.duration_days} days</span>
                                        </div>
                                    </div>

                                    {/* FEATURES LIST (Placeholder if no features in API) */}
                                    <div className="flex-1 space-y-4 mb-8">
                                        <div className={`w-full h-px ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`} />
                                        <ul className="space-y-4">
                                            {['Premium Support', 'Unlimited Access', 'Expert Consultation', 'Verified Badge'].map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <FaCheckCircle className="text-red-600 flex-shrink-0" size={16} />
                                                    <span className={`text-sm font-bold ${muted}`}>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* ACTION BUTTON */}
                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all
                      ${isRecommended
                                                ? "bg-red-600 text-white shadow-xl shadow-red-600/30 hover:bg-red-700 hover:scale-[1.02]"
                                                : `${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"}`
                                            }
                    `}
                                    >
                                        Get Started <FaArrowRight />
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
