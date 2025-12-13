"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, Trash2, Link2, MoreVertical, Loader2 } from "lucide-react";
import { deletePlayer, linkPlayerToUser } from "@/actions/player.actions";

export default function PlayerActions({ player, usersWithoutPlayers = [], canDelete = false }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const playerName = player.user?.name || player.name || player.playerId;

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete player "${playerName}"? This will also delete all their stats and tournament records.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePlayer(player.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Player deleted successfully");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete player");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  const handleLink = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsLinking(true);
    try {
      const result = await linkPlayerToUser(player.id, selectedUserId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Player linked to user successfully");
        setShowLinkModal(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to link player");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48 z-20">
            <Link
              href={`/admin/players/${player.playerId}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Edit className="w-4 h-4" />
              View Profile
            </Link>
            
            {!player.userId && usersWithoutPlayers.length > 0 && (
              <button
                onClick={() => {
                  setShowLinkModal(true);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Link2 className="w-4 h-4" />
                Link to User
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Player
              </button>
            )}
          </div>
        </>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Link Player to User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a user account to link with player <strong>{playerName}</strong>.
            </p>
            
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-4"
            >
              <option value="">Select a user...</option>
              {usersWithoutPlayers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                disabled={isLinking || !selectedUserId}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
