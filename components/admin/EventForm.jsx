"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { 
  Loader2, Plus, Trash2, GripVertical, Copy, ChevronUp, ChevronDown,
  Type, AlignLeft, Mail, Phone, Hash, List, Circle, Square, Upload, 
  Image as ImageIcon, FileText, Link as LinkIcon, Calendar, Clock, X
} from "lucide-react";
import { createEvent, updateEvent } from "@/actions/event.actions";
import { createSport } from "@/actions/stats.actions";

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
const MANDATORY_FIELD_IDS = ["name", "email", "mobile", "profileImage"];

// Initial default fields for new events
const DEFAULT_FIELDS = [
  { id: "name", type: "text", label: "Full Name", required: true, options: [], helpText: "Auto-filled from user profile", isMandatory: true },
  { id: "email", type: "email", label: "Email Address", required: true, options: [], helpText: "Auto-filled from user profile", isMandatory: true },
  { id: "mobile", type: "tel", label: "Mobile Number", required: true, options: [], helpText: "Auto-filled from user profile", isMandatory: true },
  { id: "profileImage", type: "image", label: "Profile Photo", required: true, options: [], helpText: "Auto-filled from user profile", isMandatory: true, imageUrl: "" },
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
    type: event?.type || "General",
    eventDate: event?.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "",
    venue: event?.venue || "",
    isPaid: event?.isPaid || false,
    upiQrImage: event?.upiQrImage || "",
    isActive: event?.isActive ?? true,
    organizerId: event?.tournament?.organizerId || "",
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
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="General">General Event</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Enter event description"
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
          </div>

          {/* Organizer Selection (Optional) */}
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
                    {/* Note/Description type */}
                    {field.type === "note" && (
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

                    {/* Image Preview type */}
                    {field.type === "image" && (
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

                    {/* Regular input fields */}
                    {!["note", "image"].includes(field.type) && (
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

                    {/* Options for select/radio/checkbox */}
                    {["select", "radio", "checkbox"].includes(field.type) && (
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

                    {/* Required toggle and field type change for non-display fields */}
                    {!["note", "image"].includes(field.type) && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Field Type
                          </label>
                          {isMandatoryField ? (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
                              {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                              <span className="text-xs text-gray-500 ml-2">(locked)</span>
                            </span>
                          ) : (
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
                          )}
                        </div>
                        {isMandatoryField ? (
                          <span className="flex items-center gap-2 text-sm text-blue-600">
                            <span>Always Required</span>
                            <input
                              type="checkbox"
                              checked={true}
                              disabled
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-not-allowed"
                            />
                          </span>
                        ) : (
                          <label className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700">Required</span>
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(index, "required", e.target.checked)}
                              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                          </label>
                        )}
                      </div>
                    )}
                    
                    {/* Mandatory field info */}
                    {isMandatoryField && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                        <p className="font-medium">🔒 Mandatory Field</p>
                        <p className="text-blue-600 text-xs mt-1">This field is auto-filled from the user's profile during registration and cannot be deleted.</p>
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
