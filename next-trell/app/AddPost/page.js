"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Edit, Trash2, CheckCircle2, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null); // for inline edit
  const [editedText, setEditedText] = useState({ Title: "", Description: "" });
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
      confirmButtonColor: "#ef4444",
    });
    if (confirm.isConfirmed) {
      await supabase.from("NotePad").delete().eq("id", id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      Swal.fire("Deleted!", "Note removed successfully.", "success");
    }
  }

  async function toggleComplete(id, status) {
    await supabase.from("NotePad").update({ completed: !status }).eq("id", id);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, completed: !status } : n))
    );
  }

  function startEditing(note) {
    setEditingNote(note.id);
    setEditedText({ Title: note.Title, Description: note.Description });
  }

  async function saveEdit(id) {
    const { error } = await supabase
      .from("NotePad")
      .update({
        Title: editedText.Title,
        Description: editedText.Description,
      })
      .eq("id", id);

    if (error) {
      Swal.fire("Update Failed", error.message, "error");
    } else {
      Swal.fire({
        icon: "success",
        title: "Note Updated 🎉",
        text: "Your note was saved successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, Title: editedText.Title, Description: editedText.Description }
            : n
        )
      );
      setEditingNote(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#e0f2fe] font-[Poppins] p-8 overflow-y-auto relative">
      {/* Background Animation Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-indigo-100 to-purple-200 animate-[gradientMove_10s_ease_infinite] bg-[length:400%_400%] -z-10"></div>

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
                className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 relative"
              >
                {editingNote === note.id ? (
                  <>
                    <input
                      type="text"
                      value={editedText.Title}
                      onChange={(e) =>
                        setEditedText({ ...editedText, Title: e.target.value })
                      }
                      className="w-full mb-3 text-lg font-semibold border border-gray-300 px-3 py-2 rounded-lg"
                    />
                    <textarea
                      rows="3"
                      value={editedText.Description}
                      onChange={(e) =>
                        setEditedText({
                          ...editedText,
                          Description: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-gray-300 px-3 py-2 rounded-lg mb-3"
                    />
                    <button
                      onClick={() => saveEdit(note.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all shadow-md hover:shadow-lg"
                    >
                      <Save size={16} /> Save
                    </button>
                  </>
                ) : (
                  <>
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
                          onClick={() => startEditing(note)}
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
                  </>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
