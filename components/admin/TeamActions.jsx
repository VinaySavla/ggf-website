"use client";

import Link from "next/link";
import { Edit, Users } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { deleteTeam } from "@/actions/team.actions";

export default function TeamActions({ team, userRole }) {
  return (
    <div className="flex items-center justify-end space-x-2">
      <Link
        href={`/admin/teams/${team.id}/roster`}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        title="Manage Roster"
      >
        <Users className="w-4 h-4" />
      </Link>
      <Link
        href={`/admin/teams/${team.id}/edit`}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </Link>
      {userRole === "SUPER_ADMIN" && (
        <DeleteButton
          id={team.id}
          name={team.name}
          deleteAction={deleteTeam}
          confirmMessage={`Are you sure you want to delete team "${team.name}"? This will remove all roster assignments.`}
        />
      )}
    </div>
  );
}
