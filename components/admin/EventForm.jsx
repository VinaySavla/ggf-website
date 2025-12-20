"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import dynamic from "next/dynamic";
import { 
  Loader2, Plus, Trash2, GripVertical, Copy, ChevronUp, ChevronDown,
  Type, AlignLeft, Mail, Phone, Hash, List, Circle, Square, Upload, 
  Image as ImageIcon, FileText, Link as LinkIcon, Calendar, Clock, X
} from "lucide-react";
import { createEvent, updateEvent } from "@/actions/event.actions";
import { createSport } from "@/actions/stats.actions";

// Dynamically import RichTextEditor to prevent SSR issues
const RichTextEditor = dynamic(() => import("./RichTextEditor"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading editor...</span>
    </div>
  )
});

// Field types similar to Google Forms
const FIELD_TYPES = [
  { value: "text", label: "Short Answer", icon: Type },
  { value: "textarea", label: "Paragraph", icon: AlignLeft },
  { value: "email", label: "Email", icon: Mail },
  { value: "tel", label: "Phone Number", icon: Phone },
  { value: "number", label: "Number", icon: Hash },
  { value: "select", label: "Dropdown", icon: List },
  { value: "radio", label: "Multiple Choice", icon: Circle },
  { value: "checkbox", label: "Checkboxes", icon: Square },
  { value: "file", label: "File Upload", icon: Upload },
  { value: "date", label: "Date", icon: Calendar },
  { value: "time", label: "Time", icon: Clock },
  { value: "url", label: "URL/Link", icon: LinkIcon },
  { value: "note", label: "Note/Description", icon: FileText },
  { value: "image", label: "Image Preview", icon: ImageIcon },
];

// Mandatory field IDs that cannot be deleted or have their type changed
// These are auto-filled from user profile during registration
const MANDATORY_FIELD_IDS = ["name", "email", "mobile", "gender"];

// Initial default fields for new events
const DEFAULT_FIELDS = [
  { id: "name", type: "text", label: "Full Name", required: true, options: [], helpText: "Auto-filled from user profile", isMandatory: true },
  { id: "email", type: "email", label: "Email Address", required: true, options: [], helpText: "Auto-filled from user profile", isMandatory: true },
  { id: "mobile", type: "tel", label: "Mobile Number", required: true, options: [], helpText: "Auto-filled from user profile", isMandatory: true },
  { id: "gender", type: "radio", label: "Gender", required: true, options: ["Male", "Female"], helpText: "Auto-filled from user profile", isMandatory: true },
  { id: "profileImage", type: "image", label: "Profile Photo", required: false, options: [], helpText: "Auto-filled from user profile (optional)", isMandatory: false, imageUrl: "" },
];

export default function EventForm({ event, organizers = [], userRole, userId, sports = [] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [selectedSports, setSelectedSports] = useState(
    event?.sports?.map(es => es.sportId) || []
  );
  const [showNewSportModal, setShowNewSportModal] = useState(false);
  const [newSportName, setNewSportName] = useState("");
  const [creatingSport, setCreatingSport] = useState(false);
  const [availableSports, setAvailableSports] = useState(sports);

  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    eligibility: event?.eligibility || "",
    type: event?.type || "Seminar",
    tournamentType: event?.tournamentType || "",
    eventDate: event?.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "",
    venue: event?.venue || "",
    village: event?.village || "",
    isPaid: event?.isPaid || false,
    upiQrImage: event?.upiQrImage || "",
    isActive: event?.isActive ?? true,
    organizerId: event?.tournament?.organizerId || "",
    // Registration window
    registrationStartDate: event?.registrationStartDate ? new Date(event.registrationStartDate).toISOString().slice(0, 16) : "",
    registrationEndDate: event?.registrationEndDate ? new Date(event.registrationEndDate).toISOString().slice(0, 16) : "",
    // Registration counts
    registrationCountType: event?.registrationCountType || "common",
    maxTotalRegistrations: event?.maxTotalRegistrations || "",
    maxMaleRegistrations: event?.maxMaleRegistrations || "",
    maxFemaleRegistrations: event?.maxFemaleRegistrations || "",
  });
  
  const [formSchema, setFormSchema] = useState(
    event?.formSchema && Array.isArray(event.formSchema) 
      ? event.formSchema 
      : DEFAULT_FIELDS
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Upload QR code image
  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("folder", "events/qr-codes");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setFormData((prev) => ({ ...prev, upiQrImage: data.url }));
      toast.success("QR code uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload QR code");
    } finally {
      setUploadingQr(false);
    }
  };

  // Sport selection handlers
  const toggleSport = (sportId) => {
    setSelectedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  const handleCreateSport = async () => {
    if (!newSportName.trim()) {
      toast.error("Please enter a sport name");
      return;
    }

    setCreatingSport(true);
    try {
      const result = await createSport({ name: newSportName.trim() });
      if (result.error) {
        toast.error(result.error);
      } else {
        setAvailableSports(prev => [...prev, result.sport].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedSports(prev => [...prev, result.sport.id]);
        setNewSportName("");
        setShowNewSportModal(false);
        toast.success("Sport created and selected!");
      }
    } catch (error) {
      toast.error("Failed to create sport");
    } finally {
      setCreatingSport(false);
    }
  };

  // Add new field
  const addField = (type = "text") => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: "",
      required: false,
      options: type === "select" || type === "radio" || type === "checkbox" ? ["Option 1"] : [],
      helpText: "",
      // For file uploads
      acceptedTypes: type === "file" ? ["image/*", ".pdf"] : [],
      maxFileSize: 5, // MB
      // For note/image preview
      content: "",
      imageUrl: "",
    };
    setFormSchema([...formSchema, newField]);
    setActiveFieldIndex(formSchema.length);
  };

  // Duplicate field (not allowed for mandatory fields)
  const duplicateField = (index) => {
    const field = formSchema[index];
    
    // Don't allow duplicating mandatory fields
    if (MANDATORY_FIELD_IDS.includes(field.id)) {
      toast.error("Cannot duplicate mandatory fields");
      return;
    }
    
    const newField = {
      ...field,
      id: `field_${Date.now()}`,
      label: `${field.label} (Copy)`,
    };
    const updated = [...formSchema];
    updated.splice(index + 1, 0, newField);
    setFormSchema(updated);
    setActiveFieldIndex(index + 1);
  };

  // Remove field (not allowed for mandatory fields)
  const removeField = (index) => {
    const field = formSchema[index];
    
    // Protect mandatory fields from deletion
    if (MANDATORY_FIELD_IDS.includes(field.id)) {
      toast.error("Cannot delete mandatory fields (Name, Email, Phone). These are required for all registrations.");
      return;
    }
    
    if (formSchema.length <= 3) {
      toast.error("You must keep at least the mandatory fields (Name, Email, Phone)");
      return;
    }
    setFormSchema(formSchema.filter((_, i) => i !== index));
    setActiveFieldIndex(null);
  };

  // Update field property
  const updateField = (index, key, value) => {
    const updated = [...formSchema];
    updated[index] = { ...updated[index], [key]: value };
    setFormSchema(updated);
  };

  // Move field up/down
  const moveField = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formSchema.length) return;
    
    const updated = [...formSchema];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFormSchema(updated);
    setActiveFieldIndex(newIndex);
  };

  // Add option to radio/checkbox/select
  const addOption = (fieldIndex) => {
    const updated = [...formSchema];
    const options = updated[fieldIndex].options || [];
    updated[fieldIndex].options = [...options, `Option ${options.length + 1}`];
    setFormSchema(updated);
  };

  // Update option
  const updateOption = (fieldIndex, optionIndex, value) => {
    const updated = [...formSchema];
    updated[fieldIndex].options[optionIndex] = value;
    setFormSchema(updated);
  };

  // Remove option
  const removeOption = (fieldIndex, optionIndex) => {
    const updated = [...formSchema];
    if (updated[fieldIndex].options.length <= 1) {
      toast.error("You must have at least one option");
      return;
    }
    updated[fieldIndex].options = updated[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFormSchema(updated);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error("Please enter an event title");
      return;
    }

    // Validate tournament type when Tournament is selected
    if (formData.type === "Tournament" && !formData.tournamentType) {
      toast.error("Please select a tournament type");
      return;
    }

    // Validate form schema
    const invalidFields = formSchema.filter(
      f => !["note", "image"].includes(f.type) && !f.label.trim()
    );
    if (invalidFields.length > 0) {
      toast.error("Please fill in all field labels");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        formSchema,
        eventDate: formData.eventDate ? new Date(formData.eventDate) : null,
        registrationStartDate: formData.registrationStartDate ? new Date(formData.registrationStartDate) : null,
        registrationEndDate: formData.registrationEndDate ? new Date(formData.registrationEndDate) : null,
        maxTotalRegistrations: formData.maxTotalRegistrations ? parseInt(formData.maxTotalRegistrations) : null,
        maxMaleRegistrations: formData.maxMaleRegistrations ? parseInt(formData.maxMaleRegistrations) : null,
        maxFemaleRegistrations: formData.maxFemaleRegistrations ? parseInt(formData.maxFemaleRegistrations) : null,
        tournamentType: formData.type === "Tournament" ? formData.tournamentType : null,
        sportIds: selectedSports,
      };

      let result;
      if (event) {
        result = await updateEvent(event.id, payload);
      } else {
        result = await createEvent(payload);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(event ? "Event updated successfully!" : "Event created successfully!");
        router.refresh();
        router.push("/admin/events");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Render field type icon
  const FieldIcon = ({ type }) => {
    const fieldType = FIELD_TYPES.find(t => t.value === type);
    const Icon = fieldType?.icon || Type;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-primary px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Event Information</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) => {
                  handleChange(e);
                  // Reset tournament type when changing event type
                  if (e.target.value !== "Tournament") {
                    setFormData(prev => ({ ...prev, tournamentType: "" }));
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="Seminar">Seminar</option>
                <option value="Competition">Competition</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>

            {formData.type === "Tournament" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="tournamentType"
                  value={formData.tournamentType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Select tournament type</option>
                  <option value="General">General</option>
                  <option value="Village Specific">Village Specific</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Enter event description..."
              minHeight="120px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eligibility Criteria
            </label>
            <RichTextEditor
              value={formData.eligibility}
              onChange={(value) => setFormData(prev => ({ ...prev, eligibility: value }))}
              placeholder="Enter eligibility criteria..."
              minHeight="100px"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date & Time
              </label>
              <input
                type="datetime-local"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Enter venue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village
              </label>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Enter village name"
              />
            </div>
          </div>

          {/* Organizer Selection (Optional) - Only visible to Super Admin */}
          {userRole === "SUPER_ADMIN" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Organizer <span className="text-gray-400">(Optional)</span>
              </label>
              <select
                name="organizerId"
                value={formData.organizerId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">No organizer (Super Admin manages)</option>
                {organizers.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.email})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty if Super Admin will manage this event directly
              </p>
            </div>
          )}

          {/* Sports Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Associated Sports <span className="text-gray-400">(Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNewSportModal(true)}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                + Add New Sport
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
              {availableSports.length === 0 ? (
                <p className="text-sm text-gray-500">No sports available. Create one first.</p>
              ) : (
                availableSports.map((sport) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => toggleSport(sport.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedSports.includes(sport.id)
                        ? 'bg-primary text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-primary'
                    }`}
                  >
                    {sport.name}
                  </button>
                ))
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Click to select/deselect sports for this event
            </p>
          </div>
        </div>
      </div>

      {/* New Sport Modal */}
      {showNewSportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Sport</h3>
            <input
              type="text"
              value={newSportName}
              onChange={(e) => setNewSportName(e.target.value)}
              placeholder="Enter sport name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-4"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSport())}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNewSportModal(false);
                  setNewSportName("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSport}
                disabled={creatingSport}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {creatingSport && <Loader2 className="w-4 h-4 animate-spin" />}
                Create & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Registration Settings</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Registration Window */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Registration Window</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Registration Opens
                </label>
                <input
                  type="datetime-local"
                  name="registrationStartDate"
                  value={formData.registrationStartDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty for immediate registration</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Registration Closes
                </label>
                <input
                  type="datetime-local"
                  name="registrationEndDate"
                  value={formData.registrationEndDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty for no end date</p>
              </div>
            </div>
          </div>

          {/* Registration Count Limits */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Registration Limits</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Count Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="registrationCountType"
                    value="common"
                    checked={formData.registrationCountType === "common"}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Common (Total limit only)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="registrationCountType"
                    value="separate"
                    checked={formData.registrationCountType === "separate"}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Separate (Male & Female limits)</span>
                </label>
              </div>
            </div>

            {formData.registrationCountType === "common" ? (
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Maximum Registrations
                </label>
                <input
                  type="number"
                  name="maxTotalRegistrations"
                  value={formData.maxTotalRegistrations}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Maximum Male Registrations
                  </label>
                  <input
                    type="number"
                    name="maxMaleRegistrations"
                    value={formData.maxMaleRegistrations}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Maximum Female Registrations
                  </label>
                  <input
                    type="number"
                    name="maxFemaleRegistrations"
                    value={formData.maxFemaleRegistrations}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Registration will automatically close when the limit is reached
            </p>
          </div>
        </div>
      </div>

      {/* Payment Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-accent px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Payment Settings</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isPaid"
              id="isPaid"
              checked={formData.isPaid}
              onChange={handleChange}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
              This is a paid event
            </label>
          </div>

          {formData.isPaid && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI QR Code Image
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="upiQrImage"
                      value={formData.upiQrImage}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Enter image URL or upload"
                    />
                    <label className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition flex items-center gap-2">
                      {uploadingQr ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      <span className="hidden sm:inline">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQrUpload}
                        disabled={uploadingQr}
                      />
                    </label>
                  </div>
                </div>
                {formData.upiQrImage && (
                  <div className="w-24 h-24 relative border rounded-lg overflow-hidden">
                    <Image
                      src={formData.upiQrImage}
                      alt="UPI QR"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registration Form Builder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-purple-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Registration Form Builder</h3>
          <span className="text-purple-200 text-sm">
            {formSchema.length} field{formSchema.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="p-6">
          {/* Add Field Toolbar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Add Question Type:</p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => addField(type.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition"
                >
                  <type.icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {formSchema.map((field, index) => {
              const isMandatoryField = MANDATORY_FIELD_IDS.includes(field.id);
              return (
              <div
                key={field.id}
                onClick={() => setActiveFieldIndex(index)}
                className={`border rounded-lg transition cursor-pointer ${
                  activeFieldIndex === index 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : isMandatoryField 
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Field Header */}
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isMandatoryField ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="text-gray-400 cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <FieldIcon type={field.type} />
                    <span className="text-sm font-medium text-gray-600">
                      {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                    </span>
                    {field.label && (
                      <span className="text-sm text-gray-500">- {field.label}</span>
                    )}
                    {isMandatoryField && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">Mandatory</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveField(index, -1); }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveField(index, 1); }}
                      disabled={index === formSchema.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {!isMandatoryField && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); duplicateField(index); }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeField(index); }}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Field Content - Expanded when active */}
                {activeFieldIndex === index && (
                  <div className="p-4 space-y-4">
                    {/* Mandatory Field - Read Only View */}
                    {isMandatoryField && (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-blue-700 font-medium">🔒 Mandatory Field (Read-Only)</span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 font-medium min-w-[80px]">Label:</span>
                              <span className="text-gray-700">{field.label}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 font-medium min-w-[80px]">Type:</span>
                              <span className="text-gray-700">{FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}</span>
                            </div>
                            {field.helpText && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 font-medium min-w-[80px]">Help Text:</span>
                                <span className="text-gray-700">{field.helpText}</span>
                              </div>
                            )}
                            {field.options && field.options.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 font-medium min-w-[80px]">Options:</span>
                                <span className="text-gray-700">{field.options.join(", ")}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 font-medium min-w-[80px]">Required:</span>
                              <span className="text-gray-700">Yes (always)</span>
                            </div>
                          </div>
                          <p className="text-blue-600 text-xs mt-3 pt-3 border-t border-blue-200">
                            This field is auto-filled from the user's profile during registration. You can only reorder it using the up/down arrows.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Note/Description type - only for non-mandatory */}
                    {!isMandatoryField && field.type === "note" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Note Content
                        </label>
                        <textarea
                          value={field.content || ""}
                          onChange={(e) => updateField(index, "content", e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                          placeholder="Enter a note or instructions for the registrant..."
                        />
                      </div>
                    )}

                    {/* Image Preview type - only for non-mandatory */}
                    {!isMandatoryField && field.type === "image" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image URL for Preview
                        </label>
                        <input
                          type="text"
                          value={field.imageUrl || ""}
                          onChange={(e) => updateField(index, "imageUrl", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                        {field.imageUrl && (
                          <div className="mt-2 relative w-full h-48 border rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={field.imageUrl}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Regular input fields - only for non-mandatory */}
                    {!isMandatoryField && !["note", "image"].includes(field.type) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question/Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, "label", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="Enter question or field label"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Help Text <span className="text-gray-400">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={field.helpText || ""}
                            onChange={(e) => updateField(index, "helpText", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                            placeholder="Additional instructions for this field"
                          />
                        </div>
                      </>
                    )}

                    {/* Options for select/radio/checkbox - only for non-mandatory */}
                    {!isMandatoryField && ["select", "radio", "checkbox"].includes(field.type) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options
                        </label>
                        <div className="space-y-2">
                          {(field.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              {field.type === "radio" && (
                                <Circle className="w-4 h-4 text-gray-400" />
                              )}
                              {field.type === "checkbox" && (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                              {field.type === "select" && (
                                <span className="text-gray-400 text-sm w-6">{optionIndex + 1}.</span>
                              )}
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(index, optionIndex)}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(index)}
                            className="flex items-center gap-1 text-sm text-primary hover:text-primary-600"
                          >
                            <Plus className="w-4 h-4" />
                            Add option
                          </button>
                        </div>
                      </div>
                    )}

                    {/* File upload settings */}
                    {field.type === "file" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accepted File Types
                          </label>
                          <div className="space-y-1">
                            {[
                              { value: "image/*", label: "Images (JPG, PNG, GIF)" },
                              { value: ".pdf", label: "PDF Documents" },
                              { value: ".doc,.docx", label: "Word Documents" },
                              { value: ".xls,.xlsx", label: "Excel Files" },
                            ].map((type) => (
                              <label key={type.value} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={(field.acceptedTypes || []).includes(type.value)}
                                  onChange={(e) => {
                                    const current = field.acceptedTypes || [];
                                    const updated = e.target.checked
                                      ? [...current, type.value]
                                      : current.filter(t => t !== type.value);
                                    updateField(index, "acceptedTypes", updated);
                                  }}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                {type.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max File Size (MB)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={field.maxFileSize || 5}
                            onChange={(e) => updateField(index, "maxFileSize", parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Required toggle and field type change for non-display fields - only for non-mandatory */}
                    {!isMandatoryField && !["note", "image"].includes(field.type) && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              updateField(index, "type", newType);
                              // Add default options if switching to select/radio/checkbox
                              if (["select", "radio", "checkbox"].includes(newType) && (!field.options || field.options.length === 0)) {
                                updateField(index, "options", ["Option 1"]);
                              }
                            }}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                          >
                            {FIELD_TYPES.filter(t => !["note", "image"].includes(t.value)).map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <span className="text-gray-700">Required</span>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, "required", e.target.checked)}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
            })}
          </div>

          {/* Quick add button */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => addField("text")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary border-2 border-dashed border-primary/30 rounded-lg hover:border-primary hover:bg-primary/5 transition"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Event is active and visible to public
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {event ? "Updating..." : "Creating..."}
            </>
          ) : (
            event ? "Update Event" : "Create Event"
          )}
        </button>
      </div>
    </form>
  );
}
