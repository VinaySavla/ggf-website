"use client";

import { useState } from "react";
import axios from "axios";

export default function RegistrationForm({ eventType = "player" }) {
  const [formData, setFormData] = useState({
    first_name: "",
    father_husband_name: "",
    surname: "",
    gender: "",
    date_of_birth: "",
    whatsapp_number: "",
    address: "",
    photo: null,
    category: "",
    batsman_type: "",
    bowler_type: "",
    payment_screenshot: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
      const token = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;

      const collection = eventType === "player" ? "players" : "registrations";

      const response = await axios.post(
        `${apiUrl}/items/${collection}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage({
        type: "success",
        text: "Registration successful! We'll contact you soon.",
      });
      
      setFormData({
        first_name: "",
        father_husband_name: "",
        surname: "",
        gender: "",
        date_of_birth: "",
        whatsapp_number: "",
        address: "",
        photo: null,
        category: "",
        batsman_type: "",
        bowler_type: "",
        payment_screenshot: null,
      });
      
      e.target.reset();
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.errors?.[0]?.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        {eventType === "player" ? "Player Registration" : "Event Registration"}
      </h2>

      <p className="text-center text-gray-600 mb-6">
        Registration Fee: <span className="font-bold text-primary">₹250/-</span> via UPI
      </p>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label htmlFor="father_husband_name" className="block text-sm font-semibold text-gray-700 mb-2">
            Father/Husband's Name *
          </label>
          <input
            type="text"
            id="father_husband_name"
            name="father_husband_name"
            value={formData.father_husband_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter father's or husband's name"
          />
        </div>

        <div>
          <label htmlFor="surname" className="block text-sm font-semibold text-gray-700 mb-2">
            Surname *
          </label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your surname"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gender *
          </label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === "Male"}
                onChange={handleChange}
                required
                className="mr-2 w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">Male</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === "Female"}
                onChange={handleChange}
                required
                className="mr-2 w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">Female</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-semibold text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="whatsapp_number" className="block text-sm font-semibold text-gray-700 mb-2">
            WhatsApp Number *
          </label>
          <input
            type="tel"
            id="whatsapp_number"
            name="whatsapp_number"
            value={formData.whatsapp_number}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="10-digit mobile number"
          />
          <p className="text-xs text-gray-500 mt-1">Enter 10-digit number without +91</p>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
            Address *
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your complete address"
          />
        </div>

        <div>
          <label htmlFor="photo" className="block text-sm font-semibold text-gray-700 mb-2">
            Upload your photograph *
          </label>
          <input
            type="file"
            id="photo"
            name="photo"
            onChange={handleChange}
            required
            accept="image/*"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
          />
          <p className="text-xs text-gray-500 mt-1">Upload a recent passport-size photograph</p>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select Category</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-rounder">All-rounder</option>
            <option value="Wicket-keeper">Wicket-keeper</option>
          </select>
        </div>

        <div>
          <label htmlFor="batsman_type" className="block text-sm font-semibold text-gray-700 mb-2">
            Batsman Type *
          </label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="batsman_type"
                value="Left"
                checked={formData.batsman_type === "Left"}
                onChange={handleChange}
                required
                className="mr-2 w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">Left</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="batsman_type"
                value="Right"
                checked={formData.batsman_type === "Right"}
                onChange={handleChange}
                required
                className="mr-2 w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">Right</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bowler Type
          </label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="bowler_type"
                value="Left"
                checked={formData.bowler_type === "Left"}
                onChange={handleChange}
                className="mr-2 w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">Left</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="bowler_type"
                value="Right"
                checked={formData.bowler_type === "Right"}
                onChange={handleChange}
                className="mr-2 w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">Right</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="bowler_type"
                value="N/A"
                checked={formData.bowler_type === "N/A"}
                onChange={handleChange}
                className="mr-2 w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">N/A</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Select N/A if you don't bowl</p>
        </div>

        <div className="border-2 border-dashed border-primary rounded-lg p-6 bg-primary/5">
          <label htmlFor="payment_screenshot" className="block text-sm font-semibold text-gray-700 mb-2">
            Screenshot of fee payment done via UPI *
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Registration fee: <span className="font-bold text-primary">Rs. 250/-</span>
          </p>
          <input
            type="file"
            id="payment_screenshot"
            name="payment_screenshot"
            onChange={handleChange}
            required
            accept="image/*"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
          />
          <p className="text-xs text-gray-500 mt-2">
            Please complete the payment before uploading the screenshot
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Registration"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          * All fields marked with asterisk are mandatory
        </p>
      </form>
    </div>
  );
}