"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, LogIn, Upload, X, FileText, Image as ImageIcon, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { submitRegistration } from "@/actions/event.actions";

// Mandatory field IDs that are auto-filled from user profile
const MANDATORY_FIELD_IDS = ["firstName", "middleName", "surname", "email", "mobile", "gender"];

export default function RegistrationForm({ event }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  
  // Payment fields for paid events
  const [paymentData, setPaymentData] = useState({
    transactionId: "",
    paymentScreenshot: null,
  });
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);

  // Parse form schema
  const formSchema = typeof event.formSchema === 'string' 
    ? JSON.parse(event.formSchema) 
    : event.formSchema;

  // Auto-fill mandatory fields from user session
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        firstName: session.user.firstName || "",
        middleName: session.user.middleName || "",
        surname: session.user.surname || "",
        email: session.user.email || "",
        mobile: session.user.mobile || "",
        profileImage: session.user.photo || "",
        gender: session.user.gender || "",
      }));
    }
  }, [session]);

  const handleChange = (fieldId, value) => {
    // Don't allow changes to mandatory fields - they come from user profile
    if (MANDATORY_FIELD_IDS.includes(fieldId)) {
      return;
    }
    
    // For name fields that might be in dynamic forms, validate single word
    if (['firstName', 'middleName', 'surname'].includes(fieldId)) {
      // Only allow single word (no spaces)
      if (value.includes(' ')) {
        toast.error(`${fieldId === 'firstName' ? 'First name' : fieldId === 'middleName' ? 'Middle name' : 'Surname'} should be a single word only`);
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Handle file upload
  const handleFileUpload = async (fieldId, file, field) => {
    if (!file) return;

    // Validate file size
    const maxSize = (field.maxFileSize || 5) * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${field.maxFileSize || 5}MB`);
      return;
    }

    // Validate file type
    if (field.acceptedTypes && field.acceptedTypes.length > 0) {
      const acceptedTypes = field.acceptedTypes.join(',');
      const fileType = file.type;
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      
      const isValidType = field.acceptedTypes.some(type => {
        if (type.includes('/*')) {
          // Wildcard type like image/*
          return fileType.startsWith(type.replace('/*', '/'));
        }
        // Extension like .pdf, .doc
        return fileExt === type.toLowerCase() || type.toLowerCase().includes(fileExt);
      });

      if (!isValidType) {
        toast.error(`Invalid file type. Accepted: ${field.acceptedTypes.join(', ')}`);
        return;
      }
    }

    setUploadingFields(prev => ({ ...prev, [fieldId]: true }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('eventSlug', event.slug);
      uploadFormData.append('fieldName', field.label || fieldId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setFormData(prev => ({ ...prev, [fieldId]: result.url }));
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Remove uploaded file
  const removeFile = (fieldId) => {
    setFormData(prev => ({ ...prev, [fieldId]: '' }));
  };

  // Handle payment screenshot upload
  const handlePaymentScreenshotUpload = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadingPayment(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'payments');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setPaymentData(prev => ({ ...prev, paymentScreenshot: result.url }));
      setPaymentPreviewUrl(URL.createObjectURL(file));
      toast.success('Payment screenshot uploaded');
    } catch (error) {
      toast.error(error.message || 'Failed to upload screenshot');
    } finally {
      setUploadingPayment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session) {
      toast.error("Please login to register for events");
      router.push(`/login?callbackUrl=/events/${event.slug}`);
      return;
    }

    // Validate gender - must be set in profile
    if (!session.user.gender) {
      toast.error("Please update your profile with your gender before registering");
      router.push(`/profile?callbackUrl=/events/${event.slug}`);
      return;
    }

    // Validate payment fields for paid events
    if (event.isPaid) {
      if (!paymentData.transactionId.trim()) {
        toast.error("Please enter the Transaction ID / UTR Number");
        return;
      }
      if (!paymentData.paymentScreenshot) {
        toast.error("Please upload the payment screenshot");
        return;
      }
    }

    // Ensure mandatory fields are filled from session
    const finalFormData = {
      ...formData,
      firstName: session.user.firstName,
      middleName: session.user.middleName,
      surname: session.user.surname,
      email: session.user.email,
      mobile: session.user.mobile || formData.mobile,
      gender: session.user.gender,
      userId: session.user.id,
    };

    setIsLoading(true);

    try {
      const result = await submitRegistration({
        eventId: event.id,
        userData: finalFormData,
        // Include payment data for paid events
        ...(event.isPaid && {
          transactionId: paymentData.transactionId,
          paymentScreenshot: paymentData.paymentScreenshot,
        }),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Registration successful! Payment will be verified shortly.");
        router.push("/events");
      }
    } catch (error) {
      toast.error("Failed to submit registration");
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field) => {
    const isMandatoryField = MANDATORY_FIELD_IDS.includes(field.id);
    const isDisabled = isMandatoryField && status === "authenticated";
    
    const commonProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      disabled: isDisabled,
      readOnly: isDisabled,
      className: `w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${isDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`,
      onChange: (e) => handleChange(field.id, e.target.value),
      value: formData[field.id] || "",
    };

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            {...commonProps}
          />
        );
      case "textarea":
        return (
          <textarea
            rows={4}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            {...commonProps}
          />
        );
      case "select":
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value || option}
                  checked={formData[field.id] === (option.value || option)}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-gray-700">{option.label || option}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-gray-700">{field.checkboxLabel || field.label}</span>
          </label>
        );
      case "file":
        const isUploading = uploadingFields[field.id];
        const uploadedUrl = formData[field.id];
        const acceptedTypes = field.acceptedTypes?.join(',') || 'image/*,.pdf';
        const isImage = uploadedUrl && (uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || uploadedUrl.includes('image'));
        
        return (
          <div className="space-y-3">
            {uploadedUrl ? (
              <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  {isImage ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white">
                      <Image
                        src={uploadedUrl}
                        alt="Uploaded file"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {uploadedUrl.split('/').pop()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">✓ Uploaded successfully</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(field.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${isUploading ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p className="text-sm text-primary">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max {field.maxFileSize || 5}MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept={acceptedTypes}
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(field.id, file, field);
                    }
                  }}
                />
              </label>
            )}
            {field.acceptedTypes && field.acceptedTypes.length > 0 && (
              <p className="text-xs text-gray-500">
                Accepted: {field.acceptedTypes.map(t => t.replace('/*', '')).join(', ')}
              </p>
            )}
          </div>
        );
      case "date":
        return (
          <input
            type="date"
            {...commonProps}
          />
        );
      case "time":
        return (
          <input
            type="time"
            {...commonProps}
          />
        );
      case "note":
        // Display-only field - just show the content
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            {field.content || field.label}
          </div>
        );
      case "image":
        // For profileImage field, show user's profile photo
        if (field.id === "profileImage" && formData.profileImage) {
          return (
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-gray-100">
                <Image
                  src={formData.profileImage}
                  alt="Your profile photo"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-gray-600">Your profile photo will be used for this registration.</p>
            </div>
          );
        }
        // Display-only image preview
        return field.imageUrl ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-gray-100">
            <Image
              src={field.imageUrl}
              alt={field.label || "Preview"}
              fill
              className="object-contain"
            />
          </div>
        ) : null;
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  if (formSchema.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No registration form available for this event.</p>
      </div>
    );
  }

  // Show login prompt for unauthenticated users
  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600 mb-4">
          Please login or create an account to register for this event.
        </p>
        <Link
          href={`/login?callbackUrl=/events/${event.slug}`}
          className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Login to Register
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link href={`/register?callbackUrl=/events/${event.slug}`} className="text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info about auto-filled fields */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium">ℹ️ Your profile information is auto-filled</p>
        <p className="text-blue-600 mt-1">Name, Email, Phone, and Gender are pre-filled from your account and cannot be edited here.</p>
      </div>

      {/* Mandatory Name Fields - Always displayed first, read-only, auto-filled from profile */}
      {session?.user && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(from your profile)</span>
            </label>
            <input
              type="text"
              value={session.user.firstName || ""}
              disabled
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Middle Name <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(from your profile)</span>
            </label>
            <input
              type="text"
              value={session.user.middleName || ""}
              disabled
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surname <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(from your profile)</span>
            </label>
            <input
              type="text"
              value={session.user.surname || ""}
              disabled
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>
        </>
      )}

      {/* Email Field - Mandatory, read-only */}
      {session?.user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(from your profile)</span>
          </label>
          <input
            type="email"
            value={session.user.email || ""}
            disabled
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>
      )}

      {/* Mobile Field - Mandatory, read-only */}
      {session?.user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(from your profile)</span>
          </label>
          <input
            type="tel"
            value={session.user.mobile || ""}
            disabled
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>
      )}

      {/* Gender Display - Mandatory field from profile */}
      {session?.user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(from your profile)</span>
          </label>
          {session.user.gender ? (
            <input
              type="text"
              value={session.user.gender}
              disabled
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                Gender not set in your profile.{" "}
                <Link href={`/profile?callbackUrl=/events/${event.slug}`} className="underline font-medium">
                  Update your profile
                </Link>{" "}
                to continue.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Filter out mandatory fields from formSchema and render remaining fields */}
      {formSchema.filter(field => !MANDATORY_FIELD_IDS.includes(field.id)).map((field) => {
        const isMandatoryField = MANDATORY_FIELD_IDS.includes(field.id);
        const isDisplayField = ["note", "image"].includes(field.type);
        
        // For display-only fields (note, image), don't show label wrapper
        if (isDisplayField) {
          return (
            <div key={field.id}>
              {renderField(field)}
            </div>
          );
        }
        
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {isMandatoryField && (
                <span className="text-xs text-gray-500 ml-2">(from your profile)</span>
              )}
            </label>
            {renderField(field)}
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
          </div>
        );
      })}

      {/* Payment Section for Paid Events */}
      {event.isPaid && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 mb-6">
            <p className="font-medium">⚠️ Payment Required</p>
            <p className="mt-1">Please complete the payment before submitting your registration.</p>
          </div>

          {/* UPI QR Code */}
          {event.upiQrImage && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-4">Scan the QR code to pay via UPI</p>
              <div className="relative w-48 h-48 mx-auto mb-4 bg-white rounded-lg p-2">
                <Image
                  src={event.upiQrImage}
                  alt="UPI QR Code"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-gray-500">After payment, enter the transaction details below</p>
            </div>
          )}

          {/* Transaction ID */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID / UTR Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paymentData.transactionId}
              onChange={(e) => setPaymentData(prev => ({ ...prev, transactionId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Enter UPI transaction ID or UTR number"
              required
            />
          </div>

          {/* Payment Screenshot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Screenshot <span className="text-red-500">*</span>
            </label>
            {paymentData.paymentScreenshot ? (
              <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white">
                    <Image
                      src={paymentPreviewUrl || paymentData.paymentScreenshot}
                      alt="Payment screenshot"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">Payment proof uploaded</p>
                    <p className="text-xs text-green-600 mt-1">✓ Ready to submit</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentData(prev => ({ ...prev, paymentScreenshot: null }));
                      setPaymentPreviewUrl(null);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove screenshot"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${uploadingPayment ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingPayment ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p className="text-sm text-primary">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-primary">Click to upload</span> payment screenshot
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={uploadingPayment}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePaymentScreenshotUpload(file);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Submitting...
          </>
        ) : event.isPaid ? (
          "Submit Registration with Payment"
        ) : (
          "Submit Registration"
        )}
      </button>
    </form>
  );
}
