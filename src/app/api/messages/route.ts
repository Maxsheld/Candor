import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {        
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!user) {
            console.error("Supabase Error:", error);
            return new Response(JSON.stringify({ error: "Check your credentials" }), { status: 401 });
        }
        
        // GET requests can't have a body, so conversation_id comes in via query string.
        // e.g. /api/messages?conversation_id=abc123
        const { searchParams } = new URL(req.url)
        const conversation_id = searchParams.get("conversation_id")
        
        // Order by order_index (a SERIAL column) rather than created_at.
        // SERIAL guarantees insertion order even if timestamps are identical.
        const { data: userData, error: userError } = await supabase      
            .from("messages")
            .select("role, content")
            .eq("conversation_id", conversation_id)
            .order("order_index", { ascending: true })        

        return new Response(JSON.stringify({ messages: userData }), { status: 200 }); 
    } 
    
    catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: "Check server logs" }), { status: 500 });
    }
}

