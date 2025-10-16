import OpenAI from "openai";
const client = new OpenAI({dangerouslyAllowBrowser: true, apiKey: process.env.OPENAI_API_KEY});

export const sendToGPT = async function(req: string) {
    const response = await client.responses.create({
        model: "gpt-5-mini",
        input: req,
    });

    return response.output_text;
}