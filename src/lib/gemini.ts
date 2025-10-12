import { GoogleGenerativeAI } from "@google/generative-ai";

import { GENERATION_DECADES } from "./constants";
import { assertGeminiEnv, getEnv } from "./env";
import { createErrorId, logError, logInfo } from "./logger";

const SCOPE = "gemini";

type Decade = (typeof GENERATION_DECADES)[number];

let cachedClient: GoogleGenerativeAI | null = null;

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }
  assertGeminiEnv();
  const apiKey = getEnv("GEMINI_API_KEY");
  cachedClient = new GoogleGenerativeAI(apiKey);
  logInfo(SCOPE, "Initialized Gemini client");
  return cachedClient;
}

export async function generateDecadePortrait(options: {
  baseImage: ArrayBuffer;
  mimeType: string;
  decade: Decade;
}) {
  const { baseImage, mimeType, decade } = options;
  const client = getClient();
  const modelName = getEnv("GEMINI_MODEL");

  const model = client.getGenerativeModel({
    model: modelName,
  });

  const base64Image = Buffer.from(baseImage).toString("base64");
  const prompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;

  logInfo(SCOPE, `Requesting portrait`, { decade });

  try {
    const generation = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType,
              },
            },
          ],
        },
      ],
    });

    const candidate = generation.response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part) => {
      return "inlineData" in part;
    }) as { inlineData?: { data?: string } } | undefined;

    if (!imagePart?.inlineData?.data) {
      const errorId = createErrorId(SCOPE, "NO-IMAGE");
      logError(
        SCOPE,
        errorId,
        new Error("The Gemini response did not include image data"),
        { candidate },
      );
      throw new Error(
        `Failed to generate the ${decade} portrait. errorId=${errorId}`,
      );
    }

    logInfo(SCOPE, `Portrait ready`, { decade });

    return Buffer.from(imagePart.inlineData.data, "base64");
  } catch (error) {
    const errorId = createErrorId(SCOPE, decade);
    logError(SCOPE, errorId, error);
    throw new Error(
      `Gemini failed to generate the ${decade} portrait. errorId=${errorId}`,
    );
  }
}

