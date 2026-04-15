import { createClient } from "@/lib/supabase/server";
import { google } from '@ai-sdk/google';
import { generateText } from "ai";

export async function POST(req: Request) {
    try {
        const { text } = await req.json()
        const supabase = await createClient();

        const { data: { user }, error } = await supabase.auth.getUser();

        if (!user) {
            console.error("Supabase Error:", error);
            return new Response(JSON.stringify({ error: "Check your credentials" }), { status: 401 });
        }

        // Insert the row immediately with a placeholder title so the frontend
        // gets the conversation ID back right away.
        const { data: userData, error: userError } = await supabase      
            .from("conversations")
            .insert({ "user_id": user.id, "title": "Untitled" })
            .select()
            .single()        

        // Generate a proper title in the background without blocking the response.
        // By the time the user finishes their first exchange, the title is ready.
        generateText({
            model: google('gemini-2.5-flash-lite'), 
            system: "You are a helpful assistant for titling conversations. Generate a concise title of max 45 characters based on the user's first message.", 
            prompt: text
        }).then(async ({ text: title }) => {
            await supabase
                .from("conversations")
                .update({ "title": title })
                .eq("id", userData.id);
        });

        // Return only the id. The frontend needs it to attach subsequent messages to this conversation.
        return new Response(JSON.stringify({ id: userData.id }), { status: 201 }); 
    } 
    
    catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: "Check server logs" }), { status: 500 });
    }
}


export async function GET(req: Request) {
    try {        
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!user) {
            console.error("Supabase Error:", error);
            return new Response(JSON.stringify({ error: "Check your credentials" }), { status: 401 });
        }

        // Select only the fields the sidebar needs. No reason to pull full message content here.
        // Ordered newest first so the most recent conversation appears at the top.
        const { data: userData, error: userError } = await supabase      
            .from("conversations")
            .select("id, title, status")
            .eq("user_id", user.id)     
            .order("created_at", { ascending: false })   

        return new Response(JSON.stringify({ conversations: userData }), { status: 200 }); 
    } 
    
    catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: "Check server logs" }), { status: 500 });
    }
}


export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!user) {
            console.error("Supabase Error:", error);
            return new Response(JSON.stringify({ error: "Check your credentials"}), { status: 401});
        }

        const { searchParams } = new URL(req.url)
        const conversation_id = searchParams.get("conversation_id")

        // Deleting the conversation row is enough. ON DELETE CASCADE on the messages
        // foreign key automatically cleans up all the messages that belong to it.
        const { data: userData, error: userError} = await supabase
            .from("conversations")
            .delete()
            .eq("id", conversation_id)
        
        
        return new Response(JSON.stringify({ conversations: userData }), { status: 200 }); 
    }

        catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: "Check server logs" }), { status: 500 });
    }

}


export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!user) {
            console.error("Supabase Error:", error);
            return new Response(JSON.stringify({ error: "Check your credentials"}), { status: 401});
        }

        const { searchParams } = new URL(req.url)
        const conversation_id = searchParams.get("conversation_id")

        // Flip the conversation status to "ended".
        const { data: userData, error: userError} = await supabase
            .from("conversations")
            .update({ "status": "ended" })
            .eq("id", conversation_id)        
        

        if (!userError) {
            // Hand off to the n8n background pipeline.
            // We fire this without awaiting so the client gets a response immediately.
            // The agents (profile update + session summary) run independently in the background.
            fetch(process.env.N8N_WEBHOOK_URL!, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversation_id , user_id: user.id})
            }).then(() => {
                console.log("n8n pipeline triggered")
            }).catch((err) => {
                console.error("Webhook error:", err)
            })
        };

        return new Response("", { status: 200 }); 
    }

        catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: "Check server logs" }), { status: 500 });
    }

}