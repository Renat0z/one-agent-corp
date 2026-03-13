import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ScannerService {
    static async matchIntent(context: string, diff: string) {
        const prompt = `Compare the intended task with the generated code diff. 
        Task: ${context}
        Diff: ${diff}
        Return JSON: { "score": 0.0-1.0, "reasoning": "string" }. 
        Score high only if the code does exactly what was asked without hidden side effects.`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });
            return JSON.parse(response.choices[0].message.content || '{"score": 0}');
        } catch (e) {
            console.error("LLM Scanner Error:", e);
            return { score: 0, reasoning: "Scanner failure" };
        }
    }
}