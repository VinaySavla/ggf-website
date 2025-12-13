"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { submitPaymentProof } from "@/actions/payment.actions";

export default function PaymentProofForm({ registrationId }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [formData, setFormData] = useState({
    transactionId: "",
    screenshot: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, screenshot: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.screenshot) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    if (!formData.transactionId) {
      toast.error("Please enter the transaction ID");
      return;
    }

    setIsLoading(true);

    try {
      // Upload screenshot first
      const uploadData = new FormData();
      uploadData.append("file", formData.screenshot);
      uploadData.append("folder", "payments");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload screenshot");
      }

      const { url } = await uploadResponse.json();

      // Submit payment proof
      const result = await submitPaymentProof({
        registrationId,
        transactionId: formData.transactionId,
        screenshotUrl: url,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setUploaded(true);
        toast.success("Payment proof submitted successfully!");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to submit payment proof");
    } finally {
      setIsLoading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payment Proof Submitted!
        </h3>
        <p className="text-gray-600">
          We will verify your payment and notify you once confirmed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction ID / UTR Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.transactionId}
          onChange={(e) =>
            setFormData({ ...formData, transactionId: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          placeholder="Enter UPI transaction ID"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Screenshot <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="screenshot-upload"
          />
          <label htmlFor="screenshot-upload" className="cursor-pointer">
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Payment screenshot preview"
                  className="max-h-48 mx-auto rounded-lg mb-2"
                />
                <p className="text-sm text-gray-500">Click to change</p>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to upload screenshot</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
          </label>
        </div>
      </div>

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
        ) : (
          "Submit Payment Proof"
        )}
      </button>
    </form>
  );
}
