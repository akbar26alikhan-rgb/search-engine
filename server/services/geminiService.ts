import { GoogleGenAI } from '@google/genai';

class GeminiService {
  private ai: GoogleGenAI | null = null;
  private isAvailable = false;

  constructor() {
    this.init();
  }

  public init() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({});
        this.isAvailable = true;
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI:', err);
        this.isAvailable = false;
      }
    } else {
      this.isAvailable = false;
    }
  }

  public isConfigured(): boolean {
    return this.isAvailable && this.ai !== null;
  }

  public async generateText(prompt: string, systemInstruction?: string): Promise<string | null> {
    if (!this.ai || !this.isAvailable) return null;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      return response.text || null;
    } catch (err: any) {
      console.error('Gemini generateContent error:', err.message);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
