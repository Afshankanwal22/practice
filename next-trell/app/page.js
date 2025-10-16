"use client";
import { useState, useEffect, useRef } from "react";

export default function SmartNotes() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [reminder, setReminder] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [drawingURL, setDrawingURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    const saved = localStorage.getItem("notes");
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // 🎙️ Voice Recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.start();
    setIsRecording(true);
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      setIsRecording(false);
    };
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
  };

  // 📸 Add Image Note
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImageURL(URL.createObjectURL(file));
  };

  // 🎨 Drawing Canvas
  const openDrawingPad = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    canvas.style.border = "1px solid white";
    const ctx = canvas.getContext("2d");
    let drawing = false;

    canvas.addEventListener("mousedown", () => (drawing = true));
    canvas.addEventListener("mouseup", () => (drawing = false));
    canvas.addEventListener("mousemove", (e) => {
      if (!drawing) return;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(e.offsetX, e.offsetY, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save Drawing";
    saveBtn.style.marginTop = "10px";
    saveBtn.onclick = () => {
      setDrawingURL(canvas.toDataURL());
      document.body.removeChild(container);
    };

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.zIndex = 1000;
    container.style.background = "rgba(0,0,0,0.8)";
    container.style.padding = "20px";
    container.style.borderRadius = "12px";
    container.appendChild(canvas);
    container.appendChild(saveBtn);
    document.body.appendChild(container);
  };

  // ➕ Add note
  const addNote = () => {
    if (
      newNote.trim() === "" &&
      !audioURL &&
      !imageURL &&
      !drawingURL
    )
      return;

    const newEntry = {
      id: Date.now(),
      text: newNote,
      audio: audioURL,
      image: imageURL,
      drawing: drawingURL,
      reminder,
      completed: false,
    };

    setNotes([...notes, newEntry]);
    setNewNote("");
    setAudioURL(null);
    setImageURL(null);
    setDrawingURL(null);
    setReminder("");
  };

  const toggleComplete = (id) => {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, completed: !n.completed } : n
      )
    );
  };

  const deleteNote = (id) => setNotes(notes.filter((n) => n.id !== id));

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      <h1 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        ✨ Smart Notepad
      </h1>

      {/* Add Section */}
      <div className="bg-white/10 p-6 rounded-2xl backdrop-blur border border-white/20 mb-6 space-y-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a note..."
          className="note-input h-24 resize-none"
        />

        <div className="flex flex-wrap gap-3">
          {/* 🎙️ Voice */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
            >
              🎙️ Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
            >
              ⏹️ Stop
            </button>
          )}

          {/* 📸 Image */}
          <label className="px-4 py-2 bg-green-600 rounded-lg cursor-pointer hover:bg-green-500">
            📸 Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          {/* 🎨 Drawing */}
          <button
            onClick={openDrawingPad}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500"
          >
            🎨 Draw
          </button>

          {/* 📅 Reminder */}
          <input
            type="datetime-local"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className="note-input max-w-[220px]"
          />

          <button
            onClick={addNote}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:opacity-90"
          >
            ➕ Add Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur hover:shadow-xl transition ${
              note.completed ? "opacity-50" : ""
            }`}
          >
            <p
              className={`whitespace-pre-wrap ${
                note.completed ? "line-through" : ""
              }`}
            >
              {note.text}
            </p>

            {note.audio && (
              <audio controls className="w-full mt-3">
                <source src={note.audio} type="audio/mp3" />
              </audio>
            )}

            {note.image && (
              <img
                src={note.image}
                alt="note"
                className="mt-3 rounded-lg"
              />
            )}

            {note.drawing && (
              <img
                src={note.drawing}
                alt="drawing"
                className="mt-3 rounded-lg"
              />
            )}

            {note.reminder && (
              <p className="text-sm mt-2 text-blue-400">
                ⏰ Reminder:{" "}
                {new Date(note.reminder).toLocaleString()}
              </p>
            )}

            <div className="flex justify-between items-center mt-3">
              <button
                onClick={() => toggleComplete(note.id)}
                className="text-green-400 hover:text-green-300"
              >
                {note.completed ? "✔️ Done" : "✅ Mark Done"}
              </button>

              <button
                onClick={() => deleteNote(note.id)}
                className="text-red-400 hover:text-red-300"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
