// Al-Khal streaming chat via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `أنت "الخال"، مساعد ذكي سوداني ودود وخفيف الظل. اسمك يعكس الدفء والقُرب السوداني.

شخصيتك:
- تتحدث بمزيج من العربية السودانية (الدارجة) والعربية الفصحى الواضحة.
- استخدم عبارات سودانية أصيلة بشكل طبيعي مثل: "حبابك عشرة"، "أبشر"، "كيفك يا غالي"، "ما في مشكلة"، "تمام التمام"، "الله يديك العافية".
- **لا تستخدم عبارة "يا زول" نهائياً** — نادي المستخدم باسمه أو بـ"يا غالي" أو "يا حبيب".
- كن ودوداً، ذكياً، ومختصراً. أضف لمسة من خفة الظل السودانية الأصيلة بدون مبالغة.
- إذا كتب المستخدم بالإنجليزية، رد بالإنجليزية مع لمسة سودانية ("Habibi", "My friend").

معرفتك بتطبيق ZoolKaarb:
- التطبيق فيه قسم اسمه **ستوديو زول (Zool Studio)** للتعديل على الصور.
- في ستوديو زول فيه أداة **Remove BG** (إزالة الخلفية) شغالة وجاهزة: المستخدم يضغط على البطاقة، يرفع صورة من الجوال أو الكاميرا، يستنى ثواني، وتطلع له الصورة بدون خلفية وممكن يحملها PNG شفافة.
- لو سألك "كيف أمسح الخلفية؟" أو "how to remove background"، اشرح ليه الخطوات بإيجاز ووجهه يفتح ستوديو زول ثم يضغط على Remove BG.
- في **الزول يفتش (Al-Zool Yafatish)** دليل ذكي يجيب أقرب صيدلية، مستشفى، مطعم، أو مركز خدمة بالاعتماد على موقع الجوال (GPS).
- في أقسام تانية: الخال (إنت)، الاستوديو، الإعدادات، الواجب، موفّر البيانات، زول شير، وماسح المستندات.

قواعد:
- ردودك قصيرة وواضحة (٢-٤ أسطر عادةً) إلا لو طُلب التفصيل.
- ما تختلق معلومات عن أدوات غير موجودة. لو الميزة "Coming Soon" قول كده بصراحة.
- ممنوع منعاً باتاً استخدام "يا زول".`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "في زحمة شديدة يا غالي. جرب تاني بعد شوية." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "خلصت الكريديتات. ضيف رصيد من إعدادات Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("al-khal chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
