import React, { useState, useEffect } from 'react';
import { X, Trash2, Music } from 'lucide-react';
import type { PlaylistRecord } from '../../../shared/types';

export interface EditPlaylistModalProps {
  isOpen: boolean;
  playlist: PlaylistRecord | null;
  onClose: () => void;
  onSave: (id: string, name: string, description?: string, coverImage?: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  isOpen,
  playlist,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name || '');
      setDescription(playlist.description || '');
      setCoverImage(playlist.coverImage || '');
      setConfirmDelete(false);
    }
  }, [playlist]);

  if (!isOpen || !playlist) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onSave(playlist.id, trimmed, description.trim() || undefined, coverImage.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to update playlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onDelete(playlist.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#282828] rounded-xl shadow-modal border border-white/10 p-6 relative flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tight">Edit Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e] transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex gap-4">
            {/* Cover Preview */}
            <div className="w-36 h-36 rounded-lg bg-[#181818] border border-white/10 flex flex-col items-center justify-center shrink-0 overflow-hidden relative group">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                  onError={() => setCoverImage('')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#727272]">
                  <Music size={36} />
                  <span className="text-[11px] mt-2 text-center px-2">Cover Preview</span>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-1">
                  Playlist Name <span className="text-[#1ed760]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full px-3 py-2 bg-[#3e3e3e] rounded-md text-sm text-white placeholder-[#727272] border border-transparent focus:border-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-1">
                  Cover Image URL (optional)
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-[#3e3e3e] rounded-md text-xs text-white placeholder-[#727272] border border-transparent focus:border-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-1">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional description"
              className="w-full px-3 py-2 bg-[#3e3e3e] rounded-md text-sm text-white placeholder-[#727272] border border-transparent focus:border-white focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors focus:outline-none ${
                  confirmDelete
                    ? 'bg-[#f3727f] text-black font-bold hover:bg-[#e91429]'
                    : 'text-[#f3727f] hover:bg-[#f3727f]/10'
                }`}
              >
                <Trash2 size={14} />
                <span>{confirmDelete ? 'Confirm Delete?' : 'Delete Playlist'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-white hover:text-white/80 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-6 py-2.5 rounded-full bg-[#1ed760] text-black font-bold text-sm hover:scale-104 active:scale-100 hover:bg-[#1fdf64] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md focus:outline-none"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
