import { supabase } from "../../src/lib/supabaseClient.js";

export async function handler(event) {
  try {
    const body = JSON.parse(event.body);

    const { imageBase64, fileName } = body;

    const buffer = Buffer.from(imageBase64, "base64");

    const { data, error } = await supabase.storage
      .from("images")
      .upload(`uploads/${fileName}`, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) throw error;

    const url = supabase.storage.from("images").getPublicUrl(`uploads/${fileName}`).data.publicUrl;

    return {
      statusCode: 200,
      body: JSON.stringify({ url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
