"use client";
import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Mic, StopCircle, Image, PenTool, Clock, Save } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AddNotePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminder, setReminder] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [drawingURL, setDrawingURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const router = useRouter();

  // 🎙️ Start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];
    mediaRecorderRef.current.start();
    setIsRecording(true);

    mediaRecorderRef.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      setIsRecording(false);
    };
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  // 📸 Image upload
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
      "mt-3 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800";
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
      boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      zIndex: 9999,
    });

    container.appendChild(canvas);
    container.appendChild(saveBtn);
    document.body.appendChild(container);
  };

  // 💾 Save note with user_id
  const saveNote = async () => {
    if (!title && !description) {
      Swal.fire("Add something!", "Please write a title or note.", "info");
      return;
    }

    // ✅ Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Swal.fire("Login Required", "Please login first to save your note.", "warning");
      return;
    }

    // ✅ Insert note with user_id
    const { error } = await supabase.from("NotePad").insert([
      {
        user_id: user.id, // Important: Required by RLS
        Title: title,
        Description: description,
        remainder: reminder,
        audio: audioURL,
        image: imageURL,
        drawing: drawingURL,
        completed: false,
      },
    ]);

    if (error) Swal.fire("Error", error.message, "error");
    else {
      Swal.fire("Saved!", "Your note has been added successfully.", "success");
      router.push("/AddPost");
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3f2fd] via-[#f5f7fa] to-[#e1e6f9] p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="w-full max-w-3xl bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200 p-10 relative"
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-semibold text-gray-800 mb-8 text-center"
        >
          📝 Create a New Note
        </motion.h1>

        <div className="space-y-5">
          <motion.input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Title..."
            className="w-full p-4 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            whileFocus={{ scale: 1.02 }}
          />

          <motion.textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write your note here..."
            className="w-full h-36 p-4 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm resize-none"
            whileFocus={{ scale: 1.02 }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3 mt-4 items-center"
          >
            {!isRecording ? (
              <motion.button
                onClick={startRecording}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
              >
                <Mic size={18} /> Record
              </motion.button>
            ) : (
              <motion.button
                onClick={stopRecording}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl shadow hover:bg-red-600"
              >
                <StopCircle size={18} /> Stop
              </motion.button>
            )}

            <motion.label
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl cursor-pointer shadow hover:bg-emerald-700"
            >
              <Image size={18} /> Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </motion.label>

            <motion.button
              onClick={openDrawingPad}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl shadow hover:bg-gray-900"
            >
              <PenTool size={18} /> Draw
            </motion.button>

            <motion.div
              className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2.5 shadow-sm bg-white"
              whileHover={{ scale: 1.02 }}
            >
              <Clock size={18} className="text-gray-600" />
              <input
                type="datetime-local"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="bg-transparent focus:outline-none text-gray-700"
              />
            </motion.div>

            <motion.button
              onClick={saveNote}
              whileTap={{ scale: 0.95 }}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow hover:from-indigo-700 hover:to-blue-700"
            >
              <Save size={18} /> Save Note
            </motion.button>
          </motion.div>

          {(imageURL || drawingURL || audioURL) && (
            <motion.div
              className="mt-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {imageURL && (
                <img
                  src={imageURL}
                  alt="Preview"
                  className="w-full rounded-xl border border-gray-200 shadow-md"
                />
              )}
              {drawingURL && (
                <img
                  src={drawingURL}
                  alt="Drawing"
                  className="w-full rounded-xl border border-gray-200 shadow-md"
                />
              )}
              {audioURL && (
                <audio controls className="w-full rounded-md mt-3">
                  <source src={audioURL} type="audio/mp3" />
                </audio>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
