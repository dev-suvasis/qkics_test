import { useState, useEffect } from "react";
import { FaPlus, FaTimes, FaSearch, FaTrash, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import axiosSecure from "../../../components/utils/axiosSecure";
import { resolveMedia } from "../../../components/utils/mediaUrl";
import ModalOverlay from "../../../components/ui/ModalOverlay";
import { useAlert } from "../../../context/AlertContext";
import ConfirmationAlert from "../../../components/ui/ConfirmationAlert";
import { useSelector } from "react-redux";

export default function CompanyMembers({ companyId, isDark, isOwner, text, onLeaveSuccess }) {
  const { showAlert } = useAlert();
  const { data: loggedUser } = useSelector((state) => state.user);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Current user's role in this company
  const currentUserRole = members.find(
    (m) => (m.user?.uuid ?? m.user) === loggedUser?.uuid
  )?.role;
  const isActualOwner = isOwner || currentUserRole?.toLowerCase() === "owner";

  const fetchMembers = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await axiosSecure.get(`/v1/companies/${companyId}/members/`);
      const data = res.data?.results || res.data || [];
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [companyId]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await axiosSecure.get(`/v1/auth/search/?q=${query}`);
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (userId) => {
    try {
      const res = await axiosSecure.post(`/v1/companies/${companyId}/members/add/`, {
        user_id: userId,
      });
      setMembers((prev) => [...prev, res.data]);
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      showAlert("Member added successfully", "success");
    } catch (err) {
      console.error("Error adding member:", err);
      showAlert(err.response?.data?.message || "Error adding member", "error");
    }
  };

  const handleRemoveClick = (member) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToDelete) return;
    try {
      const userId = memberToDelete.user?.uuid ?? memberToDelete.user;
      await axiosSecure.delete(`/v1/companies/${companyId}/members/${userId}/remove/`);
      setMembers((prev) => prev.filter((m) => (m.user?.uuid ?? m.user) !== userId));
      showAlert("Member removed successfully", "success");
    } catch (err) {
      console.error("Error removing member:", err);
      showAlert(
        err.response?.data?.message || err.response?.data?.detail || "Error removing member",
        "error"
      );
    } finally {
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
    }
  };

  const confirmLeave = async () => {
    try {
      await axiosSecure.delete(`/v1/companies/${companyId}/members/${loggedUser?.uuid}/remove/`);
      showAlert("You have left the company", "success");
      setShowLeaveConfirm(false);
      onLeaveSuccess?.();
    } catch (err) {
      console.error("Error leaving company:", err);
      showAlert(err.response?.data?.message || "Error leaving company", "error");
      setShowLeaveConfirm(false);
    }
  };

  const bgCard = isDark ? "bg-neutral-900" : "bg-white";

  return (
    <div className="space-y-4">
      {/* Header: title + small + button only (no Add Member button below list) */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
          Members
        </h3>
        
        {isActualOwner ? (
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-1.5 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
            title="Add Member"
          >
            <FaPlus size={10} />
          </button>
        ) : currentUserRole && (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest shadow-sm"
            title="Leave Company"
          >
            <FaSignOutAlt size={10} />
            
          </button>
        )}
      </div>

      <div className={`rounded-2xl border p-4 ${isDark ? "border-white/5 bg-neutral-900/50" : "border-black/5 bg-neutral-50/50"}`}>
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 border border-black/5 dark:border-white/5">
                    {member.user?.profile_picture ? (
                      <img src={resolveMedia(member.user.profile_picture)} alt="Member" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-500">
                        {(member.user?.first_name || member.user?.username || "?")?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-bold truncate ${text}`}>
                        {member.user?.first_name
                          ? `${member.user.first_name} ${member.user.last_name || ""}`
                          : member.user?.username}
                      </p>
                      {/* {member.role === "Owner" && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-600/10 text-red-600 text-[6px] font-black uppercase tracking-widest border border-red-600/10">
                          Owner
                        </span>
                      )} */}
                    </div>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                      {member.role || "Member"}
                    </p>
                  </div>
                </div>

                {/* No delete button for Owner role */}
                {isActualOwner && member.role?.toLowerCase() !== "owner" && (
                  <button
                    onClick={() => handleRemoveClick(member)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-red-500 transition-all ml-2 flex-shrink-0"
                    title="Remove Member"
                  >
                    <FaTrash size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-6 text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-neutral-400">
                <FaUserPlus size={24} />
              </div>
            </div>
            <p className="italic opacity-50 text-xs">No members assigned to this organization.</p>
          </div>
        )}
      </div>

      {showSearchModal && (
        <ModalOverlay close={() => setShowSearchModal(false)}>
          <div className={`p-8 md:p-10 shadow-2xl rounded-3xl ${bgCard} shadow-black/10 max-w-lg w-full mx-4 animate-pop`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className={`text-2xl font-black tracking-tighter mb-1 ${text}`}>
                  Add New Member
                </h2>
                <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                  Search for users to add to your organization.
                </p>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-black/10 text-neutral-500"}`}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="relative mb-6">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                placeholder="Search username, first or last name..."
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {searching ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-black/5 border-black/5 hover:bg-black/10"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0">
                        {user.profile_picture ? (
                          <img src={resolveMedia(user.profile_picture)} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${text}`}>
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-[10px] opacity-50">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addMember(user.id)}
                      className="p-2.5 rounded-xl bg-red-600 text-white hover:scale-110 active:scale-95 transition-all shadow-md shadow-red-600/20"
                    >
                      <FaUserPlus size={14} />
                    </button>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-10 opacity-40 text-xs italic">
                  No users found matching "{searchQuery}"
                </div>
              ) : (
                <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest">
                  Start typing to find users
                </div>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {showLeaveConfirm && (
        <ConfirmationAlert
          title="Leave Organization"
          message="Are you sure you want to leave this organization? You will no longer have access to its private dashboard."
          confirmText="Leave"
          onConfirm={confirmLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmationAlert
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToDelete?.user?.first_name
              ? `${memberToDelete.user.first_name} ${memberToDelete.user.last_name || ""}`
              : memberToDelete?.user?.username || "this member"
            }?`}
          confirmText="Remove"
          onConfirm={confirmRemoveMember}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setMemberToDelete(null);
          }}
        />
      )}
    </div>
  );
}
