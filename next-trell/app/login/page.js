"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) router.push("/");
    })();
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      router.push("/smartnotes");
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#cfd9df] via-[#e2ebf0] to-[#f5f7fa] relative overflow-hidden">
      {/* Background blur layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/20 to-blue-200/30 backdrop-blur-3xl pointer-events-none"></div>

      {/* Login Card */}
      <div className="relative z-10 w-[90%] max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-10 sm:p-12 pointer-events-auto">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col items-center w-1/3 opacity-50">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-bold shadow-md">1</div>
            <p className="text-xs mt-2 text-gray-600 font-medium">Signup</p>
          </div>
          <div className="h-[2px] w-1/6 bg-indigo-300"></div>
          <div className="flex flex-col items-center w-1/3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold shadow-md">2</div>
            <p className="text-xs mt-2 text-gray-600 font-medium">Login</p>
          </div>
          <div className="h-[2px] w-1/6 bg-gray-200"></div>
          <div className="flex flex-col items-center w-1/3 opacity-50">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-bold shadow-md">3</div>
            <p className="text-xs mt-2 text-gray-600 font-medium">Notes</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Sign in to access your SmartNotes
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5 pointer-events-auto">
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/70 text-gray-800"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/70 text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-xl"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
          <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
            Create account
          </Link>
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              const emailPrompt = prompt("Enter your email for a magic link:");
              if (!emailPrompt) return;
              const { error } = await supabase.auth.signInWithOtp({ email: emailPrompt });
              if (error) alert(error.message);
              else alert("Check your email for the magic link.");
            }}
            className="hover:underline"
          >
            Magic link
          </a>
        </div>
      </div>
    </div>
  );
}
