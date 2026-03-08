import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SHISA_TTS_URL = "https://api.shisa.ai/tts";
const DEFAULT_SHISA_VOICE_ID = "e3362c0a-7677-4cd8-b122-91fb093305c9";

function getShisaToken() {
  const token = process.env.shsk_token;

  if (!token) {
    throw new Error("Shisa token is not configured.");
  }

  return token;
}

function getVoiceId(language: "en" | "ja") {
  if (language === "ja") {
    return process.env.SHISA_TTS_VOICE_ID_JA ?? process.env.SHISA_TTS_VOICE_ID ?? DEFAULT_SHISA_VOICE_ID;
  }

  return process.env.SHISA_TTS_VOICE_ID_EN ?? process.env.SHISA_TTS_VOICE_ID ?? DEFAULT_SHISA_VOICE_ID;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    language?: "en" | "ja";
    text?: string;
  };

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const language = body.language === "en" ? "en" : "ja";

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    const response = await fetch(SHISA_TTS_URL, {
      body: JSON.stringify({
        format: "mp3",
        stream: false,
        text,
        voice_id: getVoiceId(language),
      }),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${getShisaToken()}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Speech output is unavailable right now." }, { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
      },
      status: 200,
    });
  } catch {
    return NextResponse.json({ error: "Speech output is unavailable right now." }, { status: 502 });
  }
}
