// Edge function: Bi-directional PDF <-> Word conversion with Arabic-aware OCR
// using Lovable AI Gateway (Gemini multimodal).
//
// Request body: { mode: "pdf-to-word" | "word-to-pdf" | "ocr", file: <base64>, mimeType: string }
// Response: { content: <markdown/text>, mimeType }
//
// We return Markdown text (Arabic preserved RTL) which the client renders into
// a downloadable .docx via the `docx` lib OR a .pdf via jsPDF. Keeping the
// heavy file generation on the client avoids streaming large binaries back.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an OCR + document-conversion engine specialised in Arabic.
- Preserve Arabic characters exactly (do NOT romanise, do NOT reverse letter order).
- Maintain paragraph structure, bullet/numbered lists, and headings.
- Output clean Markdown only — no commentary, no code fences.
- Use # / ## / ### for headings, - for bullets, **bold** for emphasis.
- For tables, use Markdown table syntax.
- Right-to-left text stays in its natural reading order; do not insert LTR/RTL marks.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, file, mimeType } = await req.json();
    if (!file || !mode) {
      return new Response(JSON.stringify({ error: "Missing file or mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userPrompt =
      mode === "pdf-to-word"
        ? "Extract the full content of this PDF as well-structured Markdown. Preserve Arabic exactly."
        : mode === "ocr"
        ? "Perform OCR on this image. Return ONLY the recognised text in Markdown. Preserve Arabic exactly."
        : "Extract the full content of this Word document as Markdown. Preserve Arabic exactly.";

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${file}` },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "كثرة طلبات، جرب بعد شوية يا هندسة" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "الرصيد خلص في خدمة الذكاء، حمل رصيد لتواصل" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ content, mimeType: "text/markdown" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("pdf-convert error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
