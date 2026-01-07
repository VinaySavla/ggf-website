"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createUser } from "@/actions/admin.actions";

export default function OrganizerForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    mobile: "",
    password: "",
    role: "USER",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For name fields, only allow single word (no spaces)
    if (["firstName", "middleName", "surname"].includes(name)) {
      if (value.includes(" ")) {
        toast.error(`${name === "firstName" ? "First name" : name === "middleName" ? "Middle name" : "Surname"} should be a single word only`);
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.middleName || !formData.surname || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Mobile is required for regular users
    if (formData.role === "USER" && !formData.mobile) {
      toast.error("Mobile number is required for regular users");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createUser(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User created successfully!");
        router.push("/admin/users");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
        >
          <option value="USER">User</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {formData.role === "USER" && "Regular user - can register for events"}
          {formData.role === "ORGANIZER" && "Organizer - can create and manage events"}
          {formData.role === "SUPER_ADMIN" && "Super Admin - full access to all features"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Enter first name (single word)"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Middle Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="middleName"
          value={formData.middleName}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Enter middle name (single word)"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Surname <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="surname"
          value={formData.surname}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Enter surname (single word)"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Enter email address"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mobile Number {formData.role === "USER" && <span className="text-red-500">*</span>}
        </label>
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Enter mobile number"
          required={formData.role === "USER"}
        />
        {formData.role !== "USER" && (
          <p className="mt-1 text-xs text-gray-500">Optional for organizers and admins</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-12"
            placeholder="Create a password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4">
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
              Creating...
            </>
          ) : (
            "Create User"
          )}
        </button>
      </div>
    </form>
  );
}
