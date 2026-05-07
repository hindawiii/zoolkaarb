const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPTS: Record<string, string> = {
  "remove-bg":
    "Remove the background from this image completely. Return ONLY the main subject with a fully transparent background. Preserve fine details like hair edges. Output as PNG with transparency.",
  restore:
    "Restore this old or damaged photo. Remove scratches, noise, and blemishes. Recover natural colors and sharpness while keeping the original composition and faces identical. Output a clean, high-quality version.",
  enhance:
    "Enhance this photo with AI: improve sharpness, lighting, color balance, and overall clarity. Make it look like a professional high-resolution shot. Do not change the subject or composition.",
  "filter-bw":
    "Convert this photo to a high-contrast cinematic black and white. Keep crisp details and tonal depth. No color tint.",
  "filter-warm":
    "Apply a warm, golden-hour color filter to this photo. Boost warm tones (orange/gold), keep skin tones natural, slight film grain.",
  "filter-cool":
    "Apply a cool cinematic color grade to this photo. Cyan-blue shadows, gentle highlights, modern moody look. Keep faces natural.",

  // AI Studio Suite
  "anime-hero":
    "Transform the person in this photo into a high-quality Japanese anime character. Vibrant colors, clean cel-shading, expressive eyes, dynamic hair. Keep recognizable facial features and pose.",
  "clothes-formal":
    "Replace the clothing of the person in this photo with elegant formal wear (sharp suit or evening dress). Match lighting, shadows, and skin tone perfectly. Keep face, hair, and pose identical.",
  "clothes-traditional":
    "Replace the clothing of the person in this photo with traditional Sudanese attire (jalabiya/thobe with imma turban for men, vibrant toub for women). Match lighting, shadows, and skin tone. Keep face and pose identical.",
  "clothes-casual":
    "Replace the clothing of the person in this photo with stylish modern casual streetwear. Match lighting, shadows, and skin tone. Keep face, hair, and pose identical.",
  "face-swap":
    "Take the face from the SECOND image and seamlessly blend it onto the person in the FIRST image. Match skin tone, lighting direction, shadows, and color grading perfectly. Preserve the body, pose, and background of the first image. Photorealistic result.",
  "smart-blender":
    "Merge the provided images into a single cohesive composition. Apply AI color harmonization to unify lighting, shadows, and color grading across all elements so they look like one natural photo.",
  "challenge-arena":
    "Create a side-by-side VS battle composition from the two provided images. Place them on left and right halves with a dramatic golden divider. Match lighting and add a cinematic dark vignette. Leave clear empty space in the center for a VS badge overlay.",
};

// ===== Anime Transformation Studio (ControlNet/LoRA-style prompt composer) =====
const STYLE_PROMPTS: Record<string, string> = {
  dbz: "Akira Toriyama Dragon Ball Z / Super shonen anime style: bold thick black inking, cel-shaded primary colors, hyper-defined muscular anatomy, sharp angular jawlines, large expressive determined eyes, dramatic speed-line backgrounds.",
  naruto: "Masashi Kishimoto Naruto Shippuden style: clean cel-shaded line art, slightly muted earthy palette, sharp shonen facial geometry, ninja-headband-friendly composition, dynamic shinobi posture.",
  "one-piece": "Eiichiro Oda One Piece style: exaggerated proportions, expressive cartoon-leaning faces, bold inking, vibrant tropical adventure palette, pirate-era ambience.",
  hxh: "Yoshihiro Togashi Hunter x Hunter style: refined detailed line art, painterly soft cel-shading, rich saturated highlights, mature shonen character design.",
  conan: "Gosho Aoyama Detective Conan style: classic 90s shonen mystery look, cleaner softer line art, realistic proportions, urban detective ambience.",
};
const HERO_PROMPTS: Record<string, string> = {
  goku: "Force the identity of Son Goku from Dragon Ball Z: signature spiky black (or golden Super Saiyan) upright spiky hair, orange gi with blue undershirt and belt, Kanji symbol on chest, confident grin.",
  naruto: "Force the identity of Naruto Uzumaki: bright spiky blond hair, blue eyes, three whisker marks on each cheek, orange and black tracksuit jacket, Konoha forehead protector.",
  luffy: "Force the identity of Monkey D. Luffy: messy black hair under iconic straw hat with red ribbon, scar under left eye, red open vest, blue shorts, wide carefree smile.",
};
const AURA_PROMPTS: Record<string, string> = {
  kaio: "Add an explosive Dragon Ball Ki aura: blazing golden-white energy bursting from the torso outward, lightning sparks, ground debris floating upward, intense rim light on the subject.",
  chakra: "Add a swirling blue Naruto Chakra aura around the torso: translucent flowing energy ribbons, soft cyan glow, faint kanji-like sigils.",
  nen: "Add a Hunter x Hunter Nen aura: dense controlled energy outline hugging the body, subtle multicolor shimmer, focused intense vibe.",
  haki: "Add a One Piece Conqueror's Haki aura: dark purple-black smoky energy radiating from the torso with crackling lightning, oppressive overpowering atmosphere.",
};
const HAIR_PROMPTS: Record<string, string> = {
  spiky: "Transform hair into Dragon Ball-style upright spiky shonen hair, sharp gravity-defying spikes, bold inking.",
  "ssj-gold": "Transform hair into Super Saiyan golden upright flame-shaped spiky hair, glowing yellow.",
  keep: "Keep the original hairstyle but redrawn in the chosen anime style.",
};
const PROP_PROMPTS: Record<string, string> = {
  none: "",
  saber: "Place a glowing energy saber-style sword held firmly in the subject's hand, matching the detected hand position, with bright blade glow casting light on the face.",
  rasengan: "Place a swirling blue Rasengan energy sphere held in the subject's open palm, matching the detected hand position, with cyan rim light on the hand and face.",
  staff: "Place a mystical shonen battle staff in the subject's hand, with subtle glowing runes.",
};

const buildAnimePrompt = (p: {
  style?: string; hero?: string; aura?: string; hair?: string; prop?: string;
}) => {
  const parts = [
    "Transform the person in this photo into a high-fidelity Japanese Shonen anime illustration.",
    "Strictly preserve the subject's base pose, head tilt, facial expression, and any headphones or eyewear they are wearing.",
    "Preserve recognizable facial identity (eyes shape, face structure) while restyling.",
    STYLE_PROMPTS[p.style ?? ""] ?? STYLE_PROMPTS["dbz"],
    p.hero && HERO_PROMPTS[p.hero] ? HERO_PROMPTS[p.hero] : "",
    p.hair && HAIR_PROMPTS[p.hair] ? HAIR_PROMPTS[p.hair] : "",
    p.aura && AURA_PROMPTS[p.aura] ? AURA_PROMPTS[p.aura] : "",
    p.prop && PROP_PROMPTS[p.prop] ? PROP_PROMPTS[p.prop] : "",
    "Zero tolerance for generic 'anime filter' look. Output a clean, professional, publishable Shonen anime illustration with crisp inking, cel shading, dynamic composition, and accurate hero-specific styling.",
  ].filter(Boolean);
  return parts.join(" ");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, images, action } = await req.json();
    const imageList: string[] = Array.isArray(images) && images.length > 0
      ? images
      : imageBase64
        ? [imageBase64]
        : [];
    if (imageList.length === 0) {
      return new Response(JSON.stringify({ error: "imageBase64 or images is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const prompt = PROMPTS[action];
    if (!prompt) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toDataUrl = (s: string) =>
      s.startsWith("data:") ? s : `data:image/png;base64,${s}`;
    const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
    for (const img of imageList) {
      content.push({ type: "image_url", image_url: { url: toDataUrl(img) } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Photo edit failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image returned:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("photo-edit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
