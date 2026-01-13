import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import SubscriptionFormModal from "../adminComponents/SubscriptionFormModal";
import { FaEdit } from "react-icons/fa";

export default function AdminSubscriptions({ theme }) {
  const isDark = theme === "dark";

  const [plans, setPlans] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  /* ----------------------------
        FETCH PLANS
  ---------------------------- */
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get(
        "/v1/subscriptions/admin/plans/"
      );
      setPlans(res.data.results);
      setFiltered(res.data.results);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  /* ----------------------------
        SEARCH FILTER
  ---------------------------- */
  useEffect(() => {
    const s = searchText.toLowerCase();

    const f = plans.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        String(p.price).includes(s)
    );

    setFiltered(f);
  }, [searchText, plans]);

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
        <h2 className="text-xl font-bold">Subscription Plans</h2>

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search plans..."
          className={`
            px-3 py-2 rounded-lg text-sm border w-56 mr-3 outline-none
            ${
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white"
                : "bg-neutral-100 border-neutral-300"
            }
          `}
        />

        <button
          onClick={() => {
            setEditingPlan(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-lg font-medium border border-green-400 bg-green-400/10 text-green-700 dark:border-green-500 dark:bg-green-500/20 dark:text-green-300"
        >
          + Create Plan
        </button>
      </div>

      {/* HEADER LINE */}
      <div
        className={`w-full h-px mb-4 ${
          isDark ? "bg-neutral-700" : "bg-neutral-300"
        }`}
      />

      {/* TABLE */}
      {!loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`text-xs uppercase ${
                  isDark ? "text-neutral-400" : "text-neutral-600"
                }`}
              >
                <th className="py-3 px-3 text-left">Sl No</th>
                <th className="py-3 px-3 text-left">Name</th>
                <th className="py-3 px-3 text-left">Price</th>
                <th className="py-3 px-3 text-left">Duration</th>
                <th className="py-3 px-3 text-center">Active</th>
                <th className="py-3 px-3 text-center">Users</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>

              <tr>
                <td colSpan="7">
                  <div
                    className={`w-full h-px ${
                      isDark ? "bg-neutral-700" : "bg-neutral-300"
                    }`}
                  />
                </td>
              </tr>
            </thead>

            <tbody>
              {filtered.map((plan, index) => (
                <tr
                  key={plan.uuid}
                  className={`border-b ${
                    isDark
                      ? "border-neutral-700 hover:bg-neutral-800/40"
                      : "border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <td className="py-3 px-3">{index + 1}</td>
                  <td className="py-3 px-3 font-medium">{plan.name}</td>
                  <td className="py-3 px-3">₹{plan.price}</td>
                  <td className="py-3 px-3">
                    {plan.duration_days} days
                  </td>
                  <td className="py-3 px-3 text-center">
                    {plan.is_active ? "Yes" : "No"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {plan.active_user_count}
                  </td>

                  <td className="py-3 px-3 flex justify-center">
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setShowModal(true);
                      }}
                      disabled={plan.active_user_count > 0}
                      className={`p-2 rounded-lg border ${
                        plan.active_user_count > 0
                          ? "opacity-40 cursor-not-allowed"
                          : "text-blue-600 border-blue-400 bg-blue-400/10 hover:bg-blue-400/20 dark:text-blue-300 dark:border-blue-500 dark:bg-blue-500/20"
                      }`}
                      title={
                        plan.active_user_count > 0
                          ? "Cannot edit active plan"
                          : "Edit"
                      }
                    >
                      <FaEdit size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-6 opacity-60">
                    No plans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-10 text-center opacity-70 text-sm">
          Loading plans...
        </p>
      )}

      {/* MODAL */}
      {showModal && (
        <SubscriptionFormModal
          plan={editingPlan}
          onClose={() => setShowModal(false)}
          onSuccess={fetchPlans}
          isDark={isDark}
        />
      )}
    </div>
  );
}
