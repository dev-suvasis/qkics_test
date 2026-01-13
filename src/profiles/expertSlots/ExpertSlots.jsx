import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchExpertSlots,
  createExpertSlot,
  updateExpertSlot,
  deleteExpertSlot,
} from "../../redux/slices/expertSlotsSlice";
import useThemeClasses from "../../components/utils/useThemeClasses";

import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

import SlotForm from "./SlotForm";
import SlotCard from "./SlotCard";

export default function ExpertSlots({ theme }) {
  const isDark = theme === "dark";
  const { bg, card, border, input } = useThemeClasses(isDark);
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  console.log("ExpertSlots theme:", theme, "isDark:", isDark);
  /* ----------------------------
      REDUX STATE
  ----------------------------- */
  const user = useSelector((state) => state.user.data);
  const { items: slots, loading, error } = useSelector(
    (state) => state.expertSlots
  );

  /* ----------------------------
      LOCAL UI STATE
  ----------------------------- */
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  /* ----------------------------
      FETCH SLOTS
  ----------------------------- */
  useEffect(() => {
    if (!user) return;
    if (!user.uuid) return;
    if (user.user_type !== "expert") return;

    dispatch(fetchExpertSlots(user.uuid));
  }, [user, dispatch]);


  /* ----------------------------
      CREATE / UPDATE SLOT
  ----------------------------- */
  const handleSave = async (payload, slotUuid = null) => {
    try {
      if (slotUuid) {
        await dispatch(
          updateExpertSlot({ slotUuid, payload })
        ).unwrap();
        showAlert("Slot updated successfully", "success");
      } else {
        await dispatch(createExpertSlot(payload)).unwrap();
        showAlert("Slot created successfully", "success");
      }

      setShowModal(false);
      setEditingSlot(null);


    } catch (err) {
      if (typeof err === "object") {
        const msg =
          err.start_datetime?.[0] ||
          err.non_field_errors?.[0] ||
          "Save failed";
        showAlert(msg, "error");
      } else {
        showAlert(err, "error");
      }
    }
  };

  /* ----------------------------
      DELETE SLOT
  ----------------------------- */
  const handleDelete = (slotUuid) => {
    showConfirm({
      title: "Delete Slot",
      message: "Are you sure you want to delete this slot?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",

      onConfirm: async () => {
        try {
          await dispatch(deleteExpertSlot(slotUuid)).unwrap();
          showAlert("Slot deleted successfully", "success");
        } catch (err) {
          showAlert(
            typeof err === "string" ? err : "Delete failed",
            "error"
          );
        }
      },
    });
  };

  const sortedSlots = [...slots].sort(
  (a, b) =>
    new Date(a.start_datetime) - new Date(b.start_datetime)
);



  /* ----------------------------
      UI
  ----------------------------- */
  return (
    <div className="pt-20 px-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Booking Slots</h1>

        <button
          onClick={() => {
            setEditingSlot(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          + Add Slot
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center mt-10">Loading slots...</div>
      ) : error ? (
        <div className="text-center mt-10 text-red-500">
          {error}
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center mt-10 text-neutral-500">
          No slots created yet
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sortedSlots.map((slot) => (
  <SlotCard
    key={slot.uuid}
    slot={slot}
    isDark={isDark}
    onEdit={() => {
      setEditingSlot(slot);
      setShowModal(true);
    }}
    onDelete={() => handleDelete(slot.uuid)}
  />
))}

        </div>
      )}

      {/* ======================
          MODAL
      ======================= */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          onClick={() => {
            setShowModal(false);
            setEditingSlot(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-xl mx-4 rounded-xl shadow-lg p-6
        max-h-[90vh] overflow-y-auto border ${bg} ${border}`}
          >
            <SlotForm
              initialData={editingSlot}
              onSave={handleSave}
              onCancel={() => {
                setShowModal(false);
                setEditingSlot(null);
              }}
              isDark={isDark}
            />
          </div>
        </div>
      )}


    </div>
  );
}
