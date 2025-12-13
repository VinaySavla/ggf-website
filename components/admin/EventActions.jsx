"use client";

import Link from "next/link";
import { Eye, Edit, Trash2 } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { deleteEvent } from "@/actions/event.actions";

export default function EventActions({ event, userRole }) {
  return (
    <div className="flex items-center justify-end space-x-2">
      <Link
        href={`/events/${event.slug}`}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <Link
        href={`/admin/events/${event.id}/edit`}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </Link>
      {userRole === "SUPER_ADMIN" && (
        <DeleteButton
          id={event.id}
          name={event.title}
          deleteAction={deleteEvent}
          confirmMessage={`Are you sure you want to delete "${event.title}"? This will also delete all registrations for this event.`}
        />
      )}
    </div>
  );
}
