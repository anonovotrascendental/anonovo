import React, { useState } from 'react';
import { Sparkles, MessageSquare, Send, X } from 'lucide-react';
import { askAiAboutEvent } from '../services/geminiService';
import { Button } from './Button';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<Message[]>([]);

  const handleSend = async () => {
    if (!question.trim()) return;
    const userMsg = question;
    setQuestion('');
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    
    try {
      const response = await askAiAboutEvent(userMsg);
      setChat(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      setChat(prev => [...prev, { role: 'ai', text: "Erro na conexão com o assistente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-amber-100 overflow-hidden flex flex-col max-h-[500px]">
          <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles size={18} />
              <span>Assistente Transcendental</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[300px]">
            {chat.length === 0 && (
              <p className="text-sm text-slate-500 text-center mt-10">
                Olá! Sou o assistente de IA. Posso te ajudar com dúvidas sobre o evento ou te dar uma mensagem inspiradora.
              </p>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border p-3 rounded-2xl shadow-sm animate-pulse">Pensando...</div>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte algo..."
              className="flex-1 text-sm bg-slate-100 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button 
              onClick={handleSend}
              className="bg-amber-600 text-white p-2 rounded-xl hover:bg-amber-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-amber-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2 group"
        >
          <MessageSquare size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-bold">Dúvidas? Fale com a IA</span>
        </button>
      )}
    </div>
  );
};