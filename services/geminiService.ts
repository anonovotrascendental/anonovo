
import { GoogleGenAI } from "@google/genai";
import { EVENT_INFO } from "../constants";

export const getSpiritualGuidance = async (userName: string, context: string = ""): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Que seu Ano Novo seja repleto de paz, devoção e alegrias transcendentais! Hare Krishna!";

  const ai = new GoogleGenAI({ apiKey });
  
  try {
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
    return response.text ?? "Que seu Ano Novo seja repleto de paz, devoção e alegrias transcendentais! Hare Krishna!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Que seu Ano Novo seja repleto de paz, devoção e alegrias transcendentais! Hare Krishna!";
  }
};

export const askAiAboutEvent = async (question: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Desculpe, o assistente está temporariamente indisponível.";

  const ai = new GoogleGenAI({ apiKey });

  try {
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
    return response.text ?? "Desculpe, não consegui processar sua pergunta agora. Por favor, entre em contato com os organizadores.";
  } catch (error) {
    return "Desculpe, não consegui processar sua pergunta agora. Por favor, entre em contato com os organizadores.";
  }
};
