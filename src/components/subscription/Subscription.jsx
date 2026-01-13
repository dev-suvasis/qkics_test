import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import axiosSecure from "../utils/axiosSecure";

export default function Subscription({ theme = "light" }) {
  const isDark = theme === "dark";

  /* ============================
     THEME CLASSES
     ============================ */
  const bg = isDark ? "bg-neutral-900 text-white" : "bg-gray-50 text-black";
  const card = isDark ? "bg-neutral-800" : "bg-white";
  const border = isDark ? "border-neutral-700" : "border-gray-200";
  const mutedText = isDark ? "text-neutral-400" : "text-gray-600";
  const buttonDisabled = isDark
    ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
    : "bg-gray-300 text-gray-600 cursor-not-allowed";

  /* ============================
     STATE
     ============================ */
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribingPlan, setSubscribingPlan] = useState(null);

  /* ============================
     API CALLS
     ============================ */
  const getPlans = async () => {
    const res = await axiosSecure.get("/v1/subscriptions/plans/");
    return res.data.results || [];
  };

  const getMySubscription = async () => {
    try {
      const res = await axiosSecure.get("/v1/subscriptions/me/");
      return res.data;
    } catch {
      return null;
    }
  };

  const subscribeToPlan = async (planUuid) => {
    const res = await axiosSecure.post("/v1/subscriptions/subscribe/", {
      plan_uuid: planUuid,
    });
    return res.data;
  };

  /* ============================
     LOAD DATA
     ============================ */
  useEffect(() => {
    const load = async () => {
      try {
        const [plansData, mySubData] = await Promise.all([
          getPlans(),
          getMySubscription(),
        ]);
        setPlans(plansData);
        setMySubscription(mySubData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ============================
     SUBSCRIBE HANDLER
     ============================ */
  const handleSubscribe = async (uuid) => {
    try {
      setSubscribingPlan(uuid);
      const data = await subscribeToPlan(uuid);
      setMySubscription(data);
    } catch {
      alert("Subscription failed");
    } finally {
      setSubscribingPlan(null);
    }
  };

  /* ============================
     LOADING
     ============================ */
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        Loading subscriptions...
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 pb-12 px-6 ${bg}`}>
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold">Subscription Plans</h1>
        <p className={`mt-2 ${mutedText}`}>
          Choose a plan that fits your needs
        </p>

        {/* PLANS */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {plans.map((plan) => {
            const isActive =
              mySubscription?.plan?.uuid === plan.uuid &&
              mySubscription?.is_active;

            return (
              <div
  key={plan.uuid}
  className={`rounded-2xl p-8 shadow-xl border ${card}
    ${
      isActive
        ? "border-green-500 ring-2 ring-green-500/30"
        : border
    }`}
>


                {isActive && (
  <span className="inline-block bg-green-600 text-white text-xs px-3 py-1 rounded-full mb-4">
    Current Plan
  </span>
)}


                <h2 className="text-2xl font-semibold">{plan.name}</h2>

                <div className="text-3xl font-bold mt-3">
                  ₹{plan.price}
                </div>

                <p className={`text-sm mt-1 ${mutedText}`}>
                  {plan.duration_days} days validity
                </p>

                <ul className={`mt-6 space-y-3 text-left ${mutedText}`}>
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    {plan.premium_doc_limit_per_month} premium docs / month
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    {plan.free_consultation_count} free consultations
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    {plan.free_chat_per_month} chats / month
                  </li>
                </ul>

                <button
                  disabled={isActive || subscribingPlan === plan.uuid}
                  onClick={() => handleSubscribe(plan.uuid)}
                  className={`w-full mt-8 py-3 rounded-xl font-semibold transition
                    ${
                      isActive
                        ? buttonDisabled
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                >
                  {isActive
                    ? "Active"
                    : subscribingPlan === plan.uuid
                    ? "Processing..."
                    : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>

        {/* ACTIVE SUBSCRIPTION INFO */}
        {mySubscription && (
          <div className={`mt-12 rounded-xl p-6 shadow-xl border ${border} ${card}`}>
            <h3 className="text-xl font-semibold">
              Your Active Subscription
            </h3>
            <p className={`mt-2 ${mutedText}`}>
              Valid till{" "}
              <strong>
                {new Date(mySubscription.end_date).toLocaleDateString()}
              </strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
