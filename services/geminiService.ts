import { GoogleGenAI } from "@google/genai";
import { EVENT_INFO } from "../constants";

// The GoogleGenAI instance should be created right before use to ensure it utilizes the 
// most up-to-date API key from the environment/dialog as per guidelines.

export const getSpiritualGuidance = async (userName: string, context: string = "") => {
  // Always initialize right before making an API call to ensure current process.env.API_KEY is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    // Access the .text property directly (not a method) from the response object.
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Que seu Ano Novo seja repleto de paz, devoção e alegrias transcendentais! Hare Krishna!";
  }
};

export const askAiAboutEvent = async (question: string) => {
  // Always initialize right before making an API call to ensure current process.env.API_KEY is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Access the .text property directly (not a method) from the response object.
    return response.text;
  } catch (error) {
    return "Desculpe, não consegui processar sua pergunta agora. Por favor, entre em contato com os organizadores.";
  }
};