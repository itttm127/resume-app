import OpenAI from "openai";
const client = new OpenAI({dangerouslyAllowBrowser: true, apiKey: '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'});

export const sendToGPT = async function(req: string) {
    const response = await client.responses.create({
        model: "gpt-5-mini",
        input: req,
    });

    console.log(response.output_text);

    return response.output_text;
}