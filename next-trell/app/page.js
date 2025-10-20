"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Plus, Mic, StopCircle, Image, PenTool, Clock, Save, Edit,
  Trash2, CheckCircle2, LogOut, Search
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SmartNotes() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [reminder, setReminder] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [drawingURL, setDrawingURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const router = useRouter();

  // 🧩 Load notes when logged in
  useEffect(() => {
    checkSession();
    fetchNotes();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push("/login");
    }
  }

  async function fetchNotes() {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching notes:", error);
    else setNotes(data || []);
  }

  // 🎙️ Audio Recorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);

      mediaRecorderRef.current.ondataavailable = (e) =>
        audioChunks.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setIsRecording(false);
      };
    } catch {
      alert("🎤 Please allow microphone access");
    }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  // 🖼️ Image upload (preview only)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImageURL(URL.createObjectURL(file));
  };

  // ✏️ Drawing Pad
  const openDrawingPad = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    let drawing = false;
    canvas.style.border = "1px solid #ddd";
    canvas.style.borderRadius = "8px";

    canvas.addEventListener("mousedown", () => (drawing = true));
    canvas.addEventListener("mouseup", () => (drawing = false));
    canvas.addEventListener("mousemove", (e) => {
      if (!drawing) return;
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(e.offsetX, e.offsetY, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save Drawing";
    saveBtn.className =
      "mt-3 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition";
    saveBtn.onclick = () => {
      setDrawingURL(canvas.toDataURL());
      document.body.removeChild(container);
    };

    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 0 20px rgba(0,0,0,0.3)",
      zIndex: 9999,
    });

    container.appendChild(canvas);
    container.appendChild(saveBtn);
    document.body.appendChild(container);
  };

  // ➕ Add or Update Note
  async function addOrUpdateNote() {
    if (!newNote.trim() && !audioURL && !imageURL && !drawingURL) return;

    const note = {
      text: newNote,
      audio: audioURL,
      image: imageURL,
      drawing: drawingURL,
      reminder,
      completed: false,
    };

    if (editingId) {
      await supabase.from("notes").update(note).eq("id", editingId);
      setEditingId(null);
    } else {
      await supabase.from("notes").insert([note]);
    }

    setNewNote("");
    setAudioURL(null);
    setImageURL(null);
    setDrawingURL(null);
    setReminder("");
    fetchNotes();
  }

  async function toggleComplete(id, status) {
    await supabase.from("notes").update({ completed: !status }).eq("id", id);
    fetchNotes();
  }

  async function deleteNote(id) {
    await supabase.from("notes").delete().eq("id", id);
    fetchNotes();
  }

  const editNote = (note) => {
    setEditingId(note.id);
    setNewNote(note.text);
    setAudioURL(note.audio);
    setImageURL(note.image);
    setDrawingURL(note.drawing);
    setReminder(note.reminder || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredNotes = notes.filter((n) =>
    n.text?.toLowerCase().includes(search.toLowerCase())
  );

  // 🚪 Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f5f7fa] to-[#e2eafc] text-[#222] p-8 font-[Poppins] relative overflow-hidden">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-800">
          🧠 SmartNotes
        </h1>

        {/* 🚪 Logout Button */}
        <button
  onClick={handleLogout}
  className="absolute top-8 right-8 px-5 py-2 rounded-full font-semibold text-gray-700 bg-white/70 border border-gray-300 shadow-sm backdrop-blur-md hover:bg-blue-500 hover:text-white transition-all duration-300"
>
  Logout
</button>

      </div>

      {/* Editor */}
      <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200 shadow-md">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={editingId ? "✏️ Edit your note..." : "📝 Write your note..."}
          className="w-full h-28 p-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
        />
        <div className="flex flex-wrap gap-3 mt-4 items-center">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition"
            >
              <Mic size={16} /> Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition"
            >
              <StopCircle size={16} /> Stop
            </button>
          )}

          <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-400 transition">
            <Image size={16} /> Image
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>

          <button
            onClick={openDrawingPad}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition"
          >
            <PenTool size={16} /> Draw
          </button>

          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-600" />
            <input
              type="datetime-local"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <button
            onClick={addOrUpdateNote}
            className={`ml-auto flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
              editingId ? "bg-yellow-500 hover:bg-yellow-400" : "bg-blue-600 hover:bg-blue-500"
            } text-white`}
          >
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {editingId ? "Update" : "Save Note"}
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="max-w-5xl mx-auto mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">No notes found.</p>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition ${
                note.completed ? "opacity-60" : ""
              }`}
            >
              <p
                className={`text-gray-800 whitespace-pre-wrap text-sm leading-relaxed ${
                  note.completed ? "line-through text-gray-400" : ""
                }`}
              >
                {note.text || "🗣️ (Voice or Image note)"}
              </p>

              {note.audio && <audio controls className="w-full mt-3 rounded-lg" src={note.audio} />}
              {note.image && <img src={note.image} alt="note" className="mt-3 rounded-lg w-full" />}
              {note.drawing && <img src={note.drawing} alt="drawing" className="mt-3 rounded-lg w-full" />}
              {note.reminder && (
                <p className="text-xs mt-2 text-blue-500 font-medium">
                  ⏰ Reminder: {new Date(note.reminder).toLocaleString()}
                </p>
              )}

              <div className="flex justify-between items-center mt-4 text-sm">
                <button
                  onClick={() => toggleComplete(note.id, note.completed)}
                  className="flex items-center gap-1 text-green-600 hover:text-green-500"
                >
                  <CheckCircle2 size={16} />
                  {note.completed ? "Done" : "Mark Done"}
                </button>
                <div className="flex gap-3">
                  <button onClick={() => editNote(note)} className="text-yellow-500 hover:text-yellow-400">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className="text-red-500 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-500 w-14 h-14 flex items-center justify-center transition"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
