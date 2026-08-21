import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}

async function getConfig() {
  const { data, error } = await supabase
    .from("raffle_config")
    .select("prizes, redemption_text")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return { prizes: data.prizes as string[], redemptionText: data.redemption_text as string };
}

function isAdmin(password: unknown) {
  return typeof password === "string" && password === Deno.env.get("RAFFLE_ADMIN_PASSWORD");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "请求方式不支持" }, 405);

  try {
    const body = await req.json();
    const action = body.action;

    if (action === "get-config") return json({ config: await getConfig() });

    if (action === "draw") {
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      if (!phone) return json({ error: "请输入手机号后再抽奖" }, 400);
      if (phone.length > 100) return json({ error: "手机号内容过长" }, 400);
      const config = await getConfig();
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      const prize = config.prizes[random[0] % config.prizes.length];
      const { error } = await supabase.from("raffle_history").insert({ phone, prize });
      if (error) throw error;
      return json({ prize, redemptionText: config.redemptionText });
    }

    if (!isAdmin(body.password)) return json({ error: "密码错误，请重新输入" }, 403);

    if (action === "verify-admin") return json({ config: await getConfig() });

    if (action === "save-config") {
      const prizes = Array.isArray(body.prizes)
        ? body.prizes.map((item: unknown) => typeof item === "string" ? item.trim() : "").filter(Boolean)
        : [];
      const redemptionText = typeof body.redemptionText === "string" ? body.redemptionText.trim() : "";
      if (prizes.length < 1 || prizes.length > 20) return json({ error: "卡片数量需为 1 至 20 张" }, 400);
      if (prizes.some((item: string) => item.length > 80)) return json({ error: "单张卡片内容不能超过 80 个字" }, 400);
      if (!redemptionText || redemptionText.length > 200) return json({ error: "兑奖提示语需为 1 至 200 个字" }, 400);
      const { error } = await supabase
        .from("raffle_config")
        .update({ prizes, redemption_text: redemptionText, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      return json({ config: { prizes, redemptionText } });
    }

    if (action === "history") {
      const { data, error } = await supabase
        .from("raffle_history")
        .select("phone, prize, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return json({ records: data });
    }

    return json({ error: "未知操作" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "服务暂时不可用，请稍后重试" }, 500);
  }
});
