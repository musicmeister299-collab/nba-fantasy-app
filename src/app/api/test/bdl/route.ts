import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.BALLDONTLIE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "BALLDONTLIE_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.balldontlie.io/v1/players?per_page=100",
      {
        headers: {
          Authorization: apiKey,
        },
        cache: "no-store",
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          details: text,
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json({
      success: true,
      playerCount: data.data?.length ?? 0,
      firstFivePlayers: data.data?.slice(0, 5) ?? [],
      meta: data.meta ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}