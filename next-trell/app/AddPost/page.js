"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Edit, Trash2, CheckCircle2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion"

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data, error } = await supabase
      .from("NotePad")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setNotes(data);
  }

  async function deleteNote(id) {
    const confirm = await Swal.fire({
      title: "Delete this note?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });
    if (confirm.isConfirmed) {
      await supabase.from("NotePad").delete().eq("id", id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      Swal.fire("Deleted!", "Note removed.", "success");
    }
  }

  async function toggleComplete(id, status) {
    await supabase.from("NotePad").update({ completed: !status }).eq("id", id);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, completed: !status } : n))
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#e0f2fe] font-[Poppins] p-8 overflow-y-auto">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 drop-shadow-sm">
          📝 Smart Notes
        </h1>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={18} /> Add Note
        </button>
      </div>

      {/* Notes Grid */}
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence>
          {notes.length === 0 ? (
            <motion.p
              key="no-notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 col-span-full text-center mt-10"
            >
              No notes found.
            </motion.p>
          ) : (
            notes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 relative"
              >
                <h3 className="font-semibold text-lg text-gray-800 mb-2">
                  {note.Title}
                </h3>
                <p className="text-gray-700 text-sm mb-3">{note.Description}</p>

                {note.image && (
                  <img
                    src={note.image}
                    alt="note"
                    className="rounded-lg w-full mb-3 shadow-sm"
                  />
                )}
                {note.drawing && (
                  <img
                    src={note.drawing}
                    alt="drawing"
                    className="rounded-lg w-full mb-3 shadow-sm"
                  />
                )}
                {note.remainder && (
                  <p className="text-xs text-blue-500 mb-2">
                    ⏰ {new Date(note.remainder).toLocaleString()}
                  </p>
                )}

                <div className="flex justify-between mt-3 text-sm">
                  <button
                    onClick={() => toggleComplete(note.id, note.completed)}
                    className={`flex items-center gap-1 transition-all ${
                      note.completed
                        ? "text-green-600 hover:text-green-500"
                        : "text-gray-600 hover:text-green-600"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {note.completed ? "Completed" : "Mark Done"}
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/edit/${note.id}`)}
                      className="text-blue-500 hover:text-blue-400 transition-transform transform hover:scale-110"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-red-500 hover:text-red-400 transition-transform transform hover:rotate-12"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
