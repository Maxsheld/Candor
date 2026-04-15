"use client"

import { useState } from "react";
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  // One boolean drives both modes — login and register share the same form,
  // just with different labels and Supabase calls.
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleSubmit = async () => {
    // Browser-side client is correct here, this is a client component.
    const supabase = createClient();

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { toast.error(error.message) }
      
      if (!error) {
        router.push("/")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { toast.error(error.message) }
      console.log(error)

      if (!error) {
        router.push("/")
      }
    }
  }

  return (
    <div className="flex flex-col h-screen w-full justify-center items-center bg-zinc-900 text-zinc-100"> 
      <h2 className="text-xl mb-4 text-zinc-200 font-semibold"> Candor </h2> 
      <div className="flex flex-col w-96 bg-zinc-800 p-8 rounded-lg gap-4">            
        <h3 className="text-center text-lg font-semibold">
          {isRegistering ? "Register Page" : "Login Page"}
        </h3>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-zinc-700 border border-zinc-600 p-2 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-zinc-700 border border-zinc-600 p-2 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />   
        <button 
          className="px-4 py-1.5 bg-amber-800 rounded-full text-sm font-medium hover:bg-amber-700 transition-colors"
          onClick={handleSubmit}>
          {isRegistering ? "Register" : "Login"}
        </button>
        <button                
          className="text-sm text-indigo-500 hover:underline"
          onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
        </button>
      </div>         
    </div>
  )
}