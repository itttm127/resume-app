import OpenAI from "openai";

const client = new OpenAI({
  dangerouslyAllowBrowser: true,
  apiKey: import.meta.env.VITE_OPENAI_KEY,
});

export const sendToGPT = async function (req: string) {
  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: req,
  });

  return response.output_text;
};