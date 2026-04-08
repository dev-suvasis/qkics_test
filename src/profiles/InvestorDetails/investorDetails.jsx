import { useState, useEffect, useRef } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { FaSearch, FaCheck } from "react-icons/fa";
import { FiEdit, FiCheck as FiCheckIcon, FiX } from "react-icons/fi";

import { useSelector } from "react-redux";

export default function InvestorDetails({
  investorData,
  setInvestorData,
}) {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);
  const isDark = theme === "dark";

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const { showAlert } = useAlert();

  const normalize = (data) => ({
    ...data,
    focus_industries: data?.focus_industries || [],
    preferred_stages: data?.preferred_stages || [],
  });

  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState(normalize(investorData));

  const [allIndustries, setAllIndustries] = useState([]);
  const [allStages, setAllStages] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [indRes, stageRes] = await Promise.all([
          axiosSecure.get("/v1/investors/industries/"),
          axiosSecure.get("/v1/investors/stages/")
        ]);
        setAllIndustries(indRes.data || []);
        setAllStages(stageRes.data || []);
      } catch (error) {
        console.error("Failed to fetch industries/stages", error);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (investorData) {
      setLocal(normalize(investorData));
    }
  }, [investorData]);

  const toggleItem = (list, item) =>
    list.find((i) => i.id === item.id)
      ? list.filter((i) => i.id !== item.id)
      : [...list, item];

  const investorTypes = [
    ["angel", "Angel Investor"],
    ["vc", "VC Firm"],
    ["family_office", "Family Office"],
    ["corporate", "Corporate VC"],
  ];

  // Premium Input Styles
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

  const handleSave = async () => {
    try {
      const payload = {
        display_name: local.display_name,
        one_liner: local.one_liner,
        investment_thesis: local.investment_thesis,
        check_size_min: local.check_size_min,
        check_size_max: local.check_size_max,
        location: local.location,
        website_url: local.website_url,
        linkedin_url: local.linkedin_url,
        twitter_url: local.twitter_url,
        investor_type: local.investor_type,
        focus_industries: local.focus_industries.map((i) => i.id),
        preferred_stages: local.preferred_stages.map((s) => s.id),
      };

      const res = await axiosSecure.patch(
        "/v1/investors/me/profile/",
        payload
      );

      setInvestorData(res.data);
      setLocal(normalize(res.data));
      setEditMode(false);

      showAlert("Investor profile updated!", "success");
    } catch (err) {
      console.error(err?.response?.data || err);
      showAlert("Failed to update investor profile", "error");
    }
  };

  return (
    <div className={`premium-card p-8 md:p-12 ${isDark ? "bg-neutral-900" : "bg-white"}`}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <h2 className="text-xl font-black uppercase tracking-tight">
          <span className="hidden md:inline">Investor <span className="text-red-600">Profile</span></span>
          <span className="md:hidden">Professional <span className="text-red-600">Profile</span></span>
        </h2>

        {!readOnly && (
          <div className="flex gap-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${isDark
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "bg-neutral-100 text-black hover:bg-neutral-200"}`}
                title="Edit Details"
              >
                <FiEdit size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setLocal(normalize(investorData));
                  }}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white`}
                  title="Cancel"
                >
                  <FiX size={18} />
                </button>
                <button
                  onClick={handleSave}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10"
                  title="Save Changes"
                >
                  <FiCheckIcon size={20} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="md:col-span-2">
          <label className={labelClass}>Display Name</label>
          <input
            value={local.display_name}
            disabled={!editMode}
            onChange={(e) => setLocal({ ...local, display_name: e.target.value })}
            className={`${inputClass(editMode)} text-2xl font-bold`}
            placeholder="e.g. Acme Ventures"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>One Liner</label>
          <input
            value={local.one_liner}
            disabled={!editMode}
            onChange={(e) => setLocal({ ...local, one_liner: e.target.value })}
            className={inputClass(editMode)}
            placeholder="Brief description..."
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Investment Thesis</label>
          <textarea
            rows={3}
            value={local.investment_thesis}
            disabled={!editMode}
            onChange={(e) => setLocal({ ...local, investment_thesis: e.target.value })}
            className={`${inputClass(editMode)} resize-none`}
            placeholder="Detailed thesis..."
          />
        </div>

        {/* INDUSTRIES & STAGES */}
        <div className="md:col-span-2 space-y-6">
          <MultiSelect
            label="Focus Industries"
            items={allIndustries}
            selected={local.focus_industries}
            editMode={editMode}
            labelClass={labelClass}
            onToggle={(item) =>
              setLocal({
                ...local,
                focus_industries: toggleItem(local.focus_industries, item),
              })
            }
          />

          <MultiSelect
            label="Preferred Stages"
            items={allStages}
            selected={local.preferred_stages}
            editMode={editMode}
            labelClass={labelClass}
            onToggle={(item) =>
              setLocal({
                ...local,
                preferred_stages: toggleItem(local.preferred_stages, item),
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <div>
            <label className={labelClass}>Min Check ($)</label>
            <input
              type="number"
              value={local.check_size_min}
              onChange={(e) => setLocal({ ...local, check_size_min: e.target.value })}
              disabled={!editMode}
              className={inputClass(editMode)}
            />
          </div>
          <div>
            <label className={labelClass}>Max Check ($)</label>
            <input
              type="number"
              value={local.check_size_max}
              onChange={(e) => setLocal({ ...local, check_size_max: e.target.value })}
              disabled={!editMode}
              className={inputClass(editMode)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            value={local.location}
            onChange={(e) => setLocal({ ...local, location: e.target.value })}
            disabled={!editMode}
            className={inputClass(editMode)}
          />
        </div>

        <div>
          <label className={labelClass}>Investor Type</label>
          <select
            disabled={!editMode}
            value={local.investor_type}
            onChange={(e) => setLocal({ ...local, investor_type: e.target.value })}
            className={`${inputClass(editMode)} bg-transparent`}
          >
            {investorTypes.map(([value, label]) => (
              <option key={value} value={value} className="text-black">
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Website</label>
            <input value={local.website_url} onChange={(e) => setLocal({ ...local, website_url: e.target.value })} disabled={!editMode} className={inputClass(editMode)} />
          </div>
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input value={local.linkedin_url} onChange={(e) => setLocal({ ...local, linkedin_url: e.target.value })} disabled={!editMode} className={inputClass(editMode)} />
          </div>
          <div>
            <label className={labelClass}>Twitter</label>
            <input value={local.twitter_url} onChange={(e) => setLocal({ ...local, twitter_url: e.target.value })} disabled={!editMode} className={inputClass(editMode)} />
          </div>
        </div>

      </div>
    </div>
  );
}

function MultiSelect({ label, items, selected, editMode, onToggle, labelClass }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const dropdownRef = useRef(null);
  const theme = useSelector((state) => state.user.theme);
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = items.filter((opt) =>
    opt.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <label className={labelClass}>{label}</label>

      {!editMode ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.length ? (
            selected.map((i) => (
              <span
                key={i.id}
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-500/10 border border-blue-400/20 text-blue-500"
              >
                {i.name}
              </span>
            ))
          ) : (
            <span className="opacity-30 text-xs italic">Not specified</span>
          )}
        </div>
      ) : (
        <div className="relative mt-2" ref={dropdownRef}>
          <div
            className={`w-full p-2 rounded-lg border text-sm cursor-pointer flex justify-between items-center ${isDark
              ? "bg-[#0a0a0a] border-gray-800 text-gray-200"
              : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="truncate pr-4 font-medium">
              {selected.length > 0
                ? selected.map((opt) => opt.name).join(", ")
                : `Select ${label}`}
            </span>
            <span className="shrink-0">&#9662;</span>
          </div>

          {isOpen && (
            <div
              className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-60 flex flex-col ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
                }`}
            >
              <div
                className={`p-2 border-b ${isDark ? "border-gray-800" : "border-gray-200"
                  }`}
              >
                <div
                  className={`flex items-center rounded px-2 py-1 ${isDark ? "bg-[#0a0a0a]" : "bg-gray-100"
                    }`}
                >
                  <FaSearch
                    className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                  />
                  <input
                    type="text"
                    className={`w-full bg-transparent border-none text-sm px-2 focus:outline-none ${isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    placeholder={`Search ${label}...`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = selected.some((s) => s.id === opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm font-medium ${isSelected
                          ? isDark
                            ? "bg-red-900/30 text-red-400"
                            : "bg-red-50 text-red-600"
                          : isDark
                            ? "hover:bg-gray-800 text-gray-300"
                            : "hover:bg-gray-100 text-gray-700"
                          }`}
                        onClick={() => onToggle(opt)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected
                            ? "bg-red-600 border-red-600"
                            : isDark
                              ? "border-gray-600"
                              : "border-gray-300"
                            }`}
                        >
                          {isSelected && (
                            <FaCheck className="text-white text-[0.6rem]" />
                          )}
                        </div>
                        {opt.name}
                      </div>
                    );
                  })
                ) : (
                  <div
                    className={`p-3 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                  >
                    No matching {label.toLowerCase()} found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
