import { useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import useThemeClasses from "../../components/utils/useThemeClasses";

export default function SubscriptionFormModal({
  plan,
  onClose,
  onSuccess,
  isDark,
}) {
  const { bg, input, border } = useThemeClasses(isDark);

  const [form, setForm] = useState({
    name: plan?.name || "",
    price: plan?.price || "",
    duration_days: plan?.duration_days || "",
    premium_doc_limit_per_month:
      plan?.premium_doc_limit_per_month || "",
    free_consultation_count:
      plan?.free_consultation_count || "",
    free_chat_per_month:
      plan?.free_chat_per_month || "",
    is_active: plan?.is_active ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (plan) {
        await axiosSecure.put(
          `/v1/subscriptions/admin/plans/${plan.uuid}/`,
          form
        );
      } else {
        await axiosSecure.post(
          "/v1/subscriptions/admin/plans/",
          form
        );
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onMouseDown={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div
        className={`p-6 rounded-xl w-[520px] shadow-lg border ${bg} ${border}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {plan ? "Edit Subscription Plan" : "Create Subscription Plan"}
        </h3>

        {/* FORM */}
        <div className="space-y-3 text-sm">
          {/* NAME */}
          <div>
            <label className="block mb-1 font-medium">
              Plan Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${input} ${border}`}
            />
          </div>

          {/* PRICE */}
          <div>
            <label className="block mb-1 font-medium">
              Price (₹)
            </label>
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${input} ${border}`}
            />
          </div>

          {/* DURATION */}
          <div>
            <label className="block mb-1 font-medium">
              Duration (Days)
            </label>
            <input
              name="duration_days"
              value={form.duration_days}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${input} ${border}`}
            />
          </div>

          {/* DOC LIMIT */}
          <div>
            <label className="block mb-1 font-medium">
              Premium Documents / Month
            </label>
            <input
              name="premium_doc_limit_per_month"
              value={form.premium_doc_limit_per_month}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${input} ${border}`}
            />
          </div>

          {/* CONSULTATION */}
          <div>
            <label className="block mb-1 font-medium">
              Free Consultations
            </label>
            <input
              name="free_consultation_count"
              value={form.free_consultation_count}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${input} ${border}`}
            />
          </div>

          {/* CHAT */}
          <div>
            <label className="block mb-1 font-medium">
              Free Chats / Month
            </label>
            <input
              name="free_chat_per_month"
              value={form.free_chat_per_month}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${input} ${border}`}
            />
          </div>

          {/* ACTIVE */}
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span className="font-medium">Active</span>
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-grey-400 bg-grey-400/10 text-grey-700 dark:border-grey-500 dark:bg-grey-500/20 dark:text-grey-300"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm border border-green-400 bg-green-400/10 text-green-700 dark:border-green-500 dark:bg-green-500/20 dark:text-green-300"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
