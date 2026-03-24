import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, FaEdit, FaPlus, FaCheck, FaChevronRight } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import axiosSecure from "../../components/utils/axiosSecure";
import { resolveMedia } from "../../components/utils/mediaUrl";
import CreateCompanyModal from "./components/CreateCompanyModal";
import CompanyPosts from "./components/CompanyPosts";
import CompanyMembers from "./components/CompanyMembers";

export default function MyCompany() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const { showAlert } = useAlert();

  const [company, setCompany] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  // Form State
  const initialFormData = {
    name: "",
    description: "",
    industry: "",
    website: "",
    location: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Fetch Existing Company Profile
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/companies/my/"); 
      const results = res.data?.results || [];
      setAllCompanies(results);
      
      if (results.length > 0) {
        const fetchedCompany = results[0];
        setCompany(fetchedCompany);
        updateFormData(fetchedCompany);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const updateFormData = (fetchedCompany) => {
    setFormData({
      name: fetchedCompany.name || "",
      description: fetchedCompany.description || "",
      industry: fetchedCompany.industry || "",
      website: fetchedCompany.website || "",
      location: fetchedCompany.location || "",
    });
  };

  const handleOpenCreateModal = () => {
    setIsCreating(true);
    setEditMode(false);
    setFormData(initialFormData);
    setLogoFile(null);
    setCoverFile(null);
    setLogoPreview(null);
    setCoverPreview(null);
  };

  const handleSelectCompany = (comp) => {
    setCompany(comp);
    updateFormData(comp);
    setEditMode(false);
    setActiveTab("about");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else if (type === "cover") {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);
    submitData.append("industry", formData.industry);
    submitData.append("website", formData.website);
    submitData.append("location", formData.location);

    if (logoFile) submitData.append("logo", logoFile);
    if (coverFile) submitData.append("cover_image", coverFile);

    try {
      if (isCreating) {
        const res = await axiosSecure.post("/v1/companies/", submitData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setCompany(res.data);
          setAllCompanies(prev => [res.data, ...prev]);
          setIsCreating(false);
          showAlert("Company profile created successfully! Pending approval.", "success");
      } else {
        const res = await axiosSecure.patch(`/v1/companies/${company.id}/update/`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCompany(res.data);
        setAllCompanies(prev => prev.map(c => c.id === res.data.id ? res.data : c));
        setEditMode(false);
        showAlert("Company profile updated successfully!", "success");
      }
    } catch (err) {
      console.error("Error submitting company:", err);
      showAlert(err.response?.data?.message || "Error submitting company info", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isCreating && allCompanies.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ${isDark ? "text-white" : "text-black"}`}>Loading Companies...</span>
        </div>
      </div>
    );
  }

  const text = isDark ? "text-white" : "text-black";
  const bgCard = isDark ? "bg-neutral-900" : "bg-white";

  // MyCompany page only shows companies from /v1/companies/my/ — so the logged-in
  // user is always the owner of every company in allCompanies.
  // We set isOwner=true whenever the displayed company is in our fetched list.
  const isOwner = Boolean(
    company && (
        (company.owner?.uuid === loggedUser?.uuid) || 
        (company.owner === loggedUser?.uuid) ||
        (company.owner === loggedUser?.id) ||
        (company.owner?.id === loggedUser?.id)
    )
  );

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${text}`}>My Companies</h1>
            <p className={`text-sm tracking-wide ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              Manage your organizations and view connected profiles
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <FaPlus />
            Create Company
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MAIN COLUMN (LEFT) */}
          <div className="lg:col-span-8">
            {editMode ? (
              <div className={`p-8 md:p-12 shadow-2xl rounded-3xl ${bgCard} shadow-black/10`}>
                <div className="mb-8">
                  <h1 className={`text-3xl font-black tracking-tighter mb-2 ${text}`}>
                    Edit Company Profile
                  </h1>
                  <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                    Update your company information.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Media Uploads */}
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Logo Upload */}
                    <div className="flex-1">
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        Company Logo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                          ) : company?.logo ? (
                             <img src={resolveMedia(company.logo)} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <FaBuilding size={32} className="text-neutral-400" />
                          )}
                        </div>
                        <label className="cursor-pointer px-4 py-2 bg-red-600/10 text-red-600 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logo")} />
                        </label>
                      </div>
                    </div>

                    {/* Cover Upload */}
                    <div className="flex-1">
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        Cover Image
                      </label>
                      <div className="w-full h-24 rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 relative group">
                        {coverPreview ? (
                          <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                        ) : company?.cover_image ? (
                            <img src={resolveMedia(company.cover_image)} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-neutral-400">Add Cover Image</span>
                        )}
                         <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-bold">
                            Upload Cover
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "cover")} />
                          </label>
                      </div>                      
                    </div>
                  </div>

                  {/* Basic Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Company Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Industry *</label>
                      <input
                        type="text"
                        name="industry"
                        required
                        value={formData.industry}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        placeholder="e.g. Technology, Healthcare"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Description *</label>
                    <textarea
                      name="description"
                      required
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                      placeholder="Tell us about your company..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => { setEditMode(false); setLogoPreview(null); setCoverPreview(null); }}
                      className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-neutral-200 text-black hover:bg-neutral-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <FaCheck />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* VIEW MODE */
              company && (
                <div className="space-y-6">
                  <div className={`overflow-hidden rounded-3xl shadow-xl ${bgCard} shadow-black/10 transition-all border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Cover Image Header */}
                    <div className="h-40 md:h-48 bg-neutral-200 dark:bg-neutral-800 relative">
                      {company.cover_image ? (
                        <img src={resolveMedia(company.cover_image)} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full bg-gradient-to-r from-red-600/20 to-orange-600/20 flex items-center justify-center">
                            <FaBuilding size={48} className="text-red-500/20" />
                         </div>
                      )}
                    </div>

                    {/* Profile Info Section */}
                    <div className="px-6 md:px-8 pb-8 relative">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        
                        {/* Logo */}
                        <div className="-mt-10 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-neutral-900 bg-white dark:bg-neutral-800 flex-shrink-0 shadow-xl relative z-10">
                          {company.logo ? (
                            <img src={resolveMedia(company.logo)} alt="Logo" className="w-full h-full object-cover bg-white" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                              <FaBuilding size={40} className="text-neutral-400" />
                            </div>
                          )}
                          
                        </div>

                        {/* Header Details */}
                        <div className="flex-1 mt-4 w-full flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <h1 className={`text-3xl md:text-4xl font-black tracking-tighter mb-2 truncate ${text}`}>
                              {company.name}
                            </h1>
                            <div className="flex flex-wrap gap-4 mt-2">
                              {company.industry && (
                                <div className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>
                                  <FaBriefcase size={12} />
                                  {company.industry}
                                </div>
                              )}
                              {/* {company.location && (
                                <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                                  <FaMapMarkerAlt size={12} />
                                  {company.location}   
                                </div>
                              )}
                              {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-xs hover:underline ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                  <FaGlobe size={12} />
                                  Website
                                </a>
                              )} */}
                            </div>
                          </div>
                          
                          {isOwner && (
                            <button
                              onClick={() => setEditMode(true)}
                              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5  text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                            >
                              <FaEdit />
                              Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {/* TABS NAVIGATION */}
                      <div className={`flex justify-center mt-8 mb-6 py-3 border-b border-black/5 dark:border-white/5`}>
                        <div className={`inline-flex p-1 rounded-xl shadow-inner ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                          {['about', 'posts'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                                : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-500 hover:text-black"
                                }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* TAB CONTENT */}
                      <div className="animate-fadeIn min-h-[300px]">
                        {activeTab === "about" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                              <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                                  About Company
                                </h3>
                                <div className={`prose max-w-none text-sm leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                                  {company.description ? (
                                    <p className="whitespace-pre-line">{company.description}</p>
                                  ) : (
                                    <p className="italic opacity-50">No description provided yet.</p>
                                  )}
                                </div>
                              </div>

                              {/* Contact Info — shown directly under the description */}
                              {(company.location || company.website) && (
                                <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/5 bg-neutral-900/50" : "border-black/5 bg-neutral-50/50"}`}>
                                  <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                                    Contact Info
                                  </h3>
                                  {company.location && (
                                    <div className="flex items-center gap-2.5">
                                      <FaMapMarkerAlt size={12} className={isDark ? "text-red-400" : "text-red-500"} />
                                      <span className={`text-xs ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{company.location}</span>
                                    </div>
                                  )}
                                  {company.website && (
                                    <div className="flex items-center gap-2.5">
                                      <FaGlobe size={12} className={isDark ? "text-blue-400" : "text-blue-500"} />
                                      <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-xs truncate hover:underline ${isDark ? "text-blue-400" : "text-blue-600"}`}
                                      >
                                        {company.website.replace(/^https?:\/\//, "")}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="md:col-span-1">
                              <CompanyMembers 
                                companyId={company.id} 
                                isDark={isDark} 
                                isOwner={isOwner} 
                                text={text} 
                                onLeaveSuccess={() => {
                                  setCompany(null);
                                  fetchCompanies();
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === "posts" && (
                          <div className="mt-2">
                            <CompanyPosts companyId={company.id} isDark={isDark} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* SIDEBAR COLUMN (RIGHT) */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-neutral-900 border-white/5' : 'bg-white border-black/5'} shadow-xl shadow-black/5`}>
              <h2 className={`text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${text}`}>
                <FaBuilding className="text-red-500" />
                My Organizations
              </h2>
              
              <div className="space-y-3">
                {allCompanies.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleSelectCompany(comp)}
                    className={`w-full group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 text-left ${
                      company?.id === comp.id
                        ? "bg-red-600 border-red-600 shadow-lg shadow-red-600/20 text-white"
                        : isDark
                          ? "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10"
                          : "bg-black/5 border-black/5 text-neutral-600 hover:bg-black/10"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 border border-white/10">
                      {comp.logo ? (
                        <img src={resolveMedia(comp.logo)} alt={comp.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaBuilding size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black truncate leading-tight ${company?.id === comp.id ? "text-white" : text}`}>
                        {comp.name}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60 truncate mt-0.5 ${company?.id === comp.id ? "text-white/80" : ""}`}>
                        {comp.industry || "Organization"}
                      </p>
                    </div>
                    <FaChevronRight className={`flex-shrink-0 text-xs transition-transform group-hover:translate-x-1 ${company?.id === comp.id ? "text-white" : "opacity-30"}`} />
                  </button>
                ))}

                {allCompanies.length === 0 && !loading && (
                    <div className="text-center py-6 border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl opacity-40 italic text-xs">
                        No organizations found.
                    </div>
                )}
              </div>

              <button
                onClick={handleOpenCreateModal}
                className={`w-full mt-6 py-3.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all group ${
                  isDark ? "border-white/10 text-neutral-500 hover:border-red-500 hover:text-red-500" : "border-black/10 text-neutral-400 hover:border-red-500 hover:text-red-500"
                }`}
              >
                <FaPlus size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Register New</span>
              </button>
            </div>

            {/* QUICK STATS CARD (Optional visual filler) */}
            <div className={`p-6 rounded-3xl border overflow-hidden relative ${isDark ? 'bg-gradient-to-br from-red-600/20 to-orange-600/20 border-white/5' : 'bg-gradient-to-br from-red-50 to-orange-50 border-black/5'}`}>
                 <div className="relative z-10">
                     <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? "text-red-400" : "text-red-600"}`}>Connected Network</h3>
                     <p className={`text-2xl font-black tracking-tighter ${text}`}>{allCompanies.length} <span className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Active Profiles</span></p>
                 </div>
                 <FaBuilding size={80} className="absolute -right-4 -bottom-4 opacity-10 -rotate-12" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Company Modal wrapper */}
      {isCreating && (
        <CreateCompanyModal 
          isDark={isDark}
          closeModal={() => setIsCreating(false)}
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          logoPreview={logoPreview}
          coverPreview={coverPreview}
          loading={loading}
          onSuccess={(newComp) => {
             setAllCompanies(prev => [newComp, ...prev]);
             setCompany(newComp);
             setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}