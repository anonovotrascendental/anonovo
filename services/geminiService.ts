
import { GoogleGenAI } from "@google/genai";
import { EVENT_INFO } from "../constants";

// Helper to get spiritual guidance from AI
export const getSpiritualGuidance = async (userName: string, context: string = ""): Promise<string> => {
  // Check if API key is present
  if (!process.env.API_KEY) return "Que seu Ano Novo seja repleto de paz, devoção e alegrias transcendentais! Hare Krishna!";

  try {
    // Initialize with direct process.env.API_KEY in a named parameter as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a spiritual assistant for the event "${EVENT_INFO.title}" featuring ${EVENT_INFO.guest}. 
      The user's name is ${userName}. ${context}
      Provide a warm, welcoming, and spiritually inspiring short message (2-3 sentences) in Portuguese. 
      Include a small Vedic blessing or a reference to peace and transcendental joy for the new year.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    // The .text property directly returns the string output as per guidelines
    return response.text ?? "Que seu Ano Novo seja repleto de paz, devoção e alegrias transcendentais! Hare Krishna!";
  } catch (error) {
    console.error("Gemini Spiritual Guidance Error:", error);
    return "Que seu Ano Novo seja repleto de paz, devoção e alegrias transcendentais! Hare Krishna!";
  }
};

// Helper to ask AI about event details
export const askAiAboutEvent = async (question: string): Promise<string> => {
  // Check if API key is present
  if (!process.env.API_KEY) return "Desculpe, o assistente está temporariamente indisponível.";

  try {
    // Initialize with direct process.env.API_KEY in a named parameter as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Informação do Evento:
      Título: ${EVENT_INFO.title}
      Local: ${EVENT_INFO.location}
      Convidado Especial: ${EVENT_INFO.guest}
      Datas: ${EVENT_INFO.dates}
      Descrição: ${EVENT_INFO.description}
      Regras: Evento Day Use gratuito, focado em calcular o Prasadam (alimento sagrado).
      
      Pergunta do usuário: ${question}
      
      Responda de forma curta, gentil e prestativa em Português.`,
      config: {
        temperature: 0.5,
      }
    });
    // The .text property directly returns the string output as per guidelines
    return response.text ?? "Desculpe, não consegui processar sua pergunta agora. Por favor, entre em contato com os organizadores.";
  } catch (error) {
    console.error("Gemini Ask AI Error:", error);
    return "Desculpe, não consegui processar sua pergunta agora. Pode ser um erro de conexão temporário.";
  }
};