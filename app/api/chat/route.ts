import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || message.trim() === "") {
      return NextResponse.json({ reply: "⚠️ 请先输入问题。" });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "❌ 后端未配置 DeepSeek API Key，请检查 .env.local",
      });
    }

    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "你是一位温和友善的健康管理顾问，擅长提供饮食、运动与作息方面的建议。",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content || "AI 没有返回内容。";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("❌ Chat API 异常：", err);
    console.log("读取到的 DeepSeek Key:", `"${process.env.DEEPSEEK_API_KEY}"`);

    return NextResponse.json({
      reply: "🚨 AI 服务调用异常，请检查网络或 Key 配置。",
    });
  }
}
