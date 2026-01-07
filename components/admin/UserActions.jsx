"use client";

import Link from "next/link";
import { Edit, UserCheck, UserX } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { deleteOrganizer, toggleUserStatus } from "@/actions/admin.actions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UserActions({ user, currentUserId }) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  
  // Don't show actions for the current user or super admins
  const isSelf = user.id === currentUserId;
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const result = await toggleUserStatus(user.id, !user.isActive);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update user status");
    } finally {
      setIsToggling(false);
    }
  };

  if (isSelf || isSuperAdmin) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  return (
    <div className="flex items-center justify-end space-x-2">
      <button
        onClick={handleToggleStatus}
        disabled={isToggling}
        className={`p-2 rounded-lg transition ${
          user.isActive !== false
            ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
            : "text-green-600 hover:text-green-700 hover:bg-green-50"
        }`}
        title={user.isActive !== false ? "Deactivate" : "Activate"}
      >
        {user.isActive !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
      </button>
      <DeleteButton
        id={user.id}
        name={`${user.firstName} ${user.middleName} ${user.surname}`}
        deleteAction={deleteOrganizer}
        confirmMessage={`Are you sure you want to delete organizer "${user.firstName} ${user.middleName} ${user.surname}"? This action cannot be undone.`}
      />
    </div>
  );
}
