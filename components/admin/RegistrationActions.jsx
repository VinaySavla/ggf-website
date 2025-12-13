"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Trash2, User, Eye, X, ZoomIn } from "lucide-react";
import { updatePaymentStatus, deleteRegistration } from "@/actions/payment.actions";

export default function RegistrationActions({ registrationId, currentStatus, isPaid, userRole, playerId, playerName, userData, formSchema }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Parse formSchema to get field labels
  const parsedSchema = typeof formSchema === 'string' ? JSON.parse(formSchema || '[]') : (formSchema || []);
  const fieldLabelMap = {};
  parsedSchema.forEach(field => {
    fieldLabelMap[field.id] = field.label || field.id;
  });

  // Check if value is an image URL
  const isImageUrl = (value) => {
    if (typeof value !== 'string') return false;
    return value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || value.includes('/events/');
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsLoading(true);
    try {
      const result = await updatePaymentStatus(registrationId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Registration ${newStatus === "paid" ? "approved" : "rejected"}`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteRegistration(registrationId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Registration deleted successfully");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete registration");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // View Details Modal
  if (showDetails) {
    return (
      <>
        {/* Image Zoom Modal */}
        {zoomedImage && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] cursor-pointer"
            onClick={() => setZoomedImage(null)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition"
              >
                <X className="w-6 h-6" />
              </button>
              <Image
                src={zoomedImage}
                alt="Zoomed view"
                width={800}
                height={600}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
        
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {userData && (
              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Registrant Information</h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries(userData).map(([key, value]) => {
                      if (key === 'userId') return null; // Skip internal fields
                      
                      // Get the field label from formSchema, or format the key nicely
                      const fieldLabel = fieldLabelMap[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
                      
                      // Check if value is an image
                      if (isImageUrl(value)) {
                        return (
                          <div key={key} className="space-y-2">
                            <span className="text-gray-500 capitalize block">{fieldLabel}:</span>
                            <div 
                              className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                              onClick={() => setZoomedImage(value)}
                            >
                              <Image
                                src={value}
                                alt={fieldLabel}
                                fill
                                className="object-contain"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition">
                                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500 capitalize">{fieldLabel}:</span>
                          <span className="text-gray-900 font-medium text-right max-w-[60%]">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || 'N/A')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Player Profile Link */}
                {playerId && (
                  <div className="bg-primary/5 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Player Profile</h4>
                    <p className="text-sm text-gray-600 mb-3">This user has a registered player profile.</p>
                    <Link
                      href={`/admin/players/${playerId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition text-sm"
                      onClick={() => setShowDetails(false)}
                    >
                      <User className="w-4 h-4" />
                      View {playerName ? `${playerName}'s` : 'Player'} Profile
                    </Link>
                  </div>
                )}
              </div>
            )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowDetails(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
          <p className="text-gray-600 mb-6">Are you sure you want to delete this registration? This action cannot be undone.</p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end space-x-2">
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      ) : (
        <>
          {/* View Details Button - Always visible */}
          <button
            onClick={() => setShowDetails(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="View Registration Details"
          >
            <Eye className="w-5 h-5" />
          </button>
          
          {/* View Player Profile - Only if player exists */}
          {playerId && (
            <Link
              href={`/admin/players/${playerId}`}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
              title="View Player Profile"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
          {currentStatus !== "paid" && isPaid && (
            <>
              <button
                onClick={() => handleStatusUpdate("paid")}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                title="Approve"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Reject"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </>
          )}
          {currentStatus === "paid" && (
            <span className="text-sm text-gray-400 mr-2">Verified</span>
          )}
          {!isPaid && (
            <span className="text-sm text-gray-400 mr-2">Free Event</span>
          )}
          {userRole === "SUPER_ADMIN" && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
