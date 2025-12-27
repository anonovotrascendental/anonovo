
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Phone, 
  Info, 
  CheckCircle, 
  Leaf, 
  Lock, 
  X, 
  Home,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  MapPin,
  Clock,
  Heart,
  Sparkles,
  Quote,
  Music,
  UtensilsCrossed,
  BookOpen
} from 'lucide-react';
import { AppView, RegistrationFormData, ParticipationDays } from './types';
import { 
  EVENT_INFO, 
  ADMIN_PASSWORD, 
  ORGANIZER_PHONE, 
  GOOGLE_SCRIPT_URL,
  BLOOD_TYPES,
  ACCOMMODATION_CONFIG,
  PIX_CONFIG
} from './constants';
import { Input, Textarea } from './components/Input';
import { Button } from './components/Button';
import { AiAssistant } from './components/AiAssistant';
import AdminDashboard from './components/AdminDashboard';
import { getSpiritualGuidance } from './services/geminiService';

const App = () => {
  const [view, setView] = useState<AppView>('form');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [spiritualMessage, setSpiritualMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showHostingSuggestion, setShowHostingSuggestion] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    participationType: null,
    hostingStatus: null,
    spiritualName: '',
    civilName: '',
    rg: '',
    phone: '',
    bloodType: '',
    restrictions: '',
    days: { day31: false, day01: false, day02: false }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDayChange = (day: keyof ParticipationDays) => {
    setFormData(prev => {
      const newDays = { ...prev.days, [day]: !prev.days[day] };
      const allSelected = Object.values(newDays).every(v => v);
      if (allSelected) {
        setShowHostingSuggestion(true);
      }
      return { ...prev, days: newDays };
    });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.participationType) {
        alert("Selecione como será sua participação.");
        return;
      }
      if (formData.participationType === 'hosting' && !formData.hostingStatus) {
        alert("Informe o status da sua reserva.");
        return;
      }
      if (formData.participationType === 'dayuse' && !Object.values(formData.days).some(v => v)) {
        alert("Selecione ao menos um dia.");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);

    const selectedDaysList: string[] = [];
    if (formData.participationType === 'hosting') {
      selectedDaysList.push("Hospedagem (Pacote Completo)");
    } else {
      if (formData.days.day31) selectedDaysList.push("31/Dez");
      if (formData.days.day01) selectedDaysList.push("01/Jan");
      if (formData.days.day02) selectedDaysList.push("02/Jan");
    }

    const payload = { 
      ...formData, 
      selectedDays: selectedDaysList.join(', '),
      timestamp: new Date().toLocaleString('pt-BR')
    };

    try {
      const guidancePromise = getSpiritualGuidance(
        formData.spiritualName || formData.civilName.split(' ')[0], 
        `Evento com ${EVENT_INFO.guest}. Tipo: ${formData.participationType === 'hosting' ? 'Hospedagem' : 'Day Use'}.`
      );

      if (GOOGLE_SCRIPT_URL) {
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          console.error("Sheet Sync Error:", error);
        }
      }

      const guidance = await guidancePromise;
      setSpiritualMessage(guidance ?? null);

      const message = `*Inscrição - ${EVENT_INFO.title}* 🌸\n` +
        `*Mestre:* ${EVENT_INFO.guest}\n` +
        `*Participação:* ${formData.participationType === 'hosting' ? 'Hospedagem' : 'Day Use'}\n` +
        `*Reserva:* ${formData.hostingStatus === 'paid' ? 'Já pago' : formData.hostingStatus === 'reserving' ? 'Vou reservar' : 'N/A'}\n` +
        `*Nome:* ${formData.civilName} ${formData.spiritualName ? `(${formData.spiritualName})` : ''}\n` +
        `*Dias:* ${payload.selectedDays}\n` +
        `*Restrições:* ${formData.restrictions || 'Nenhuma'}\n\n` +
        `_Enviado pelo App Oficial do Festival_`;

      window.open(`https://wa.me/${ORGANIZER_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
      setView('success');
    } catch (error) {
      alert("Erro ao processar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const PixSection = ({ className = "" }: { className?: string }) => (
    <div className={`bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-4 ${className}`}>
      <div className="flex justify-center">
        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
          <Heart size={24} fill="currentColor" className="animate-pulse" />
        </div>
      </div>
      <div>
        <h4 className="font-bold text-emerald-900">Contribuição Voluntária</h4>
        <p className="text-xs text-emerald-700/70 mt-1">{PIX_CONFIG.description}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-inner border border-emerald-50 space-y-3">
        <div className="flex items-center justify-between gap-3 text-left">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chave PIX</p>
            <p className="text-sm font-mono text-slate-700 truncate font-bold">{PIX_CONFIG.key}</p>
          </div>
          <button 
            type="button" 
            onClick={() => copyText(PIX_CONFIG.key)}
            className="shrink-0 p-2 bg-emerald-50 text-emerald-600 rounded-lg"
          >
            {copied ? <Check size={18}/> : <Copy size={18}/>}
          </button>
        </div>
        <div className="text-[10px] text-slate-400 text-left pt-2 border-t border-slate-50">
          <p><strong>Favorecido:</strong> {PIX_CONFIG.receiver}</p>
        </div>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <Lock size={32} className="mx-auto mb-4 text-blue-600" />
        <h2 className="text-xl font-bold mb-4 font-serif">Acesso Administrativo</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const p = (e.currentTarget.elements.namedItem('pass') as HTMLInputElement).value;
          if (p === ADMIN_PASSWORD) setView('admin');
          else alert('Senha incorreta');
        }}>
          <input name="pass" type="password" placeholder="Senha" className="w-full border p-3 rounded-xl mb-4 text-center" required autoFocus />
          <Button className="w-full" variant="secondary">Entrar</Button>
        </form>
        <button onClick={() => setView('form')} className="mt-4 text-gray-400 text-sm hover:underline">Voltar</button>
      </div>
    </div>
  );

  if (view === 'admin') return <AdminDashboard onBack={() => setView('form')} />;

  if (view === 'success') return (
    <div className="min-h-screen bg-[#0a3055] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-t-[10px] border-pink-500 space-y-6">
        <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 font-serif">Inscrição Iniciada!</h2>
        <p className="text-slate-500 text-sm italic">"O sucesso espiritual começa com o primeiro passo de rendição."</p>
        
        {spiritualMessage && (
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-900 text-sm relative italic">
            <Quote className="absolute -top-2 -left-2 text-blue-200" size={32} />
            {spiritualMessage}
          </div>
        )}

        <PixSection />

        <Button variant="outline" onClick={() => { setView('form'); setStep(1); }} className="w-full">
          Fazer outra inscrição
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white py-0 font-sans flex flex-col items-center">
      {/* Container Principal com Estilo do Cartaz */}
      <div className="max-w-2xl w-full bg-white shadow-2xl overflow-hidden min-h-screen flex flex-col">
        
        {/* Header - Azul Royal Profundo */}
        <div className="bg-[#0a3055] p-8 md:p-12 text-center relative overflow-hidden">
          {/* Elementos Decorativos de Mandala (Simulados com gradientes circulares) */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          
          <h2 className="text-white text-lg md:text-xl font-bold tracking-widest uppercase mb-4 opacity-90 drop-shadow">
            {EVENT_INFO.title}
          </h2>
          
          <div className="mb-2">
            <span className="text-blue-200 text-xs uppercase tracking-[0.2em]">Com a presença ilustre de</span>
          </div>
          
          {/* Ênfase no Nome do Maharaja */}
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-[#facc15] font-serif leading-tight drop-shadow-lg">
            {EVENT_INFO.guest}
          </h1>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {EVENT_INFO.activities.map(act => (
              <span key={act} className="px-3 py-1 bg-white/10 rounded-full text-white text-[10px] uppercase font-bold border border-white/20">
                {act}
              </span>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 text-white">
            <div className="flex items-center gap-2 bg-pink-600 px-6 py-2 rounded-full font-black text-lg shadow-xl animate-pulse">
              <Calendar size={20} />
              {EVENT_INFO.dates} a partir das {EVENT_INFO.startTime}h
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-sm mt-2">
              <MapPin size={16} className="text-pink-500" />
              <span className="font-medium">{EVENT_INFO.address}</span>
            </div>
            <span className="text-xs text-blue-200 opacity-80">{EVENT_INFO.location}</span>
          </div>
        </div>

        {/* Formulário de Inscrição */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-10 space-y-8 bg-white">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step === 1 ? 'bg-pink-600 text-white' : 'bg-green-500 text-white'}`}>
                {step === 1 ? '1' : <CheckCircle size={18}/>}
              </div>
              <span className="font-bold text-slate-700">Participação</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-100"></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step === 2 ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                2
              </div>
              <span className="font-bold text-slate-400">Dados</span>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participationType: 'hosting' }))}
                  className={`p-6 rounded-2xl border-2 text-left transition-all flex justify-between items-center group ${formData.participationType === 'hosting' ? 'border-pink-500 bg-pink-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-xl ${formData.participationType === 'hosting' ? 'bg-pink-500 text-white' : 'bg-white text-slate-400'}`}>
                      <Home size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Hospedagem Completa</p>
                      <p className="text-xs text-slate-500">Inclui pernoite e alimentação {EVENT_INFO.fullDates}</p>
                    </div>
                  </div>
                  {formData.participationType === 'hosting' && <CheckCircle className="text-pink-600" size={24} />}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participationType: 'dayuse', hostingStatus: null }))}
                  className={`p-6 rounded-2xl border-2 text-left transition-all flex justify-between items-center group ${formData.participationType === 'dayuse' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-xl ${formData.participationType === 'dayuse' ? 'bg-blue-500 text-white' : 'bg-white text-slate-400'}`}>
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Day Use (Grátis)</p>
                      <p className="text-xs text-slate-500">Visitação diária para palestras e kirtans</p>
                    </div>
                  </div>
                  {formData.participationType === 'dayuse' && <CheckCircle className="text-blue-600" size={24} />}
                </button>
              </div>

              {formData.participationType === 'hosting' && (
                <div className="bg-pink-50/30 rounded-3xl p-6 border border-pink-100 space-y-4 animate-in zoom-in-95">
                  <p className="text-center font-bold text-pink-900 text-sm">Status da Reserva do Pacote</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, hostingStatus: 'paid' }))} className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${formData.hostingStatus === 'paid' ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white text-pink-600 border-pink-100'}`}>Já Paguei</button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, hostingStatus: 'reserving' }))} className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${formData.hostingStatus === 'reserving' ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white text-pink-600 border-pink-100'}`}>Vou Pagar</button>
                  </div>

                  {formData.hostingStatus === 'reserving' && (
                    <div className="bg-white rounded-2xl p-4 border border-pink-100 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-pink-600">PIX para Reserva</span>
                        <span className="text-lg font-black text-pink-700">R$ {ACCOMMODATION_CONFIG.price.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-mono text-slate-600 truncate mr-2">{ACCOMMODATION_CONFIG.pixKey}</span>
                        <button type="button" onClick={() => copyText(ACCOMMODATION_CONFIG.pixKey)} className="text-blue-600">
                          {copied ? <Check size={18}/> : <Copy size={18}/>}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">Favorecido: {ACCOMMODATION_CONFIG.pixName}</p>
                    </div>
                  )}
                </div>
              )}

              {formData.participationType === 'dayuse' && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                    <Calendar size={18}/>
                    <span>Selecione os dias da sua visita</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'day31', label: '31 Dez', sub: 'Virada de Ano' },
                      { id: 'day01', label: '01 Jan', sub: 'Início do Ano' },
                      { id: 'day02', label: '02 Jan', sub: 'Encerramento' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDayChange(d.id as keyof ParticipationDays)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center ${formData.days[d.id as keyof ParticipationDays] ? 'border-blue-500 bg-blue-50 shadow-md scale-105' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                      >
                        <span className={`text-sm font-black ${formData.days[d.id as keyof ParticipationDays] ? 'text-blue-900' : ''}`}>{d.label}</span>
                        <p className="text-[10px] opacity-60 uppercase tracking-tighter mt-1">{d.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input required name="civilName" label="Nome Completo *" value={formData.civilName} onChange={handleInputChange} placeholder="Como no documento" />
                  <Input name="spiritualName" label="Nome Espiritual" value={formData.spiritualName} onChange={handleInputChange} placeholder="Ex: Hare Krishna Das" />
                  <Input required name="rg" label="RG / Documento *" value={formData.rg} onChange={handleInputChange} placeholder="Identificação" />
                  <Input required type="tel" name="phone" label="WhatsApp *" value={formData.phone} onChange={handleInputChange} placeholder="(DDD) 9...." />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Tipo Sanguíneo</label>
                    <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 outline-none">
                      <option value="">Selecione...</option>
                      {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Textarea name="restrictions" label="Restrições Alimentares / Saúde" value={formData.restrictions} onChange={handleInputChange} placeholder="Alergias, Vegano, Medicamentos..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rodapé do Formulário - Gradiente Rosa */}
          <div className="pt-6 border-t flex gap-4">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                <ArrowLeft size={24} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 font-black py-5 rounded-2xl shadow-2xl transition transform active:scale-95 flex justify-center items-center gap-2 text-xl disabled:opacity-50 ${step === 1 ? 'bg-[#0a3055] text-white hover:bg-blue-900' : 'bg-pink-600 text-white hover:bg-pink-700'}`}
            >
              {loading ? 'Processando...' : (
                <>
                  {step === 1 ? 'Próximo Passo' : 'Confirmar no WhatsApp'}
                  <ChevronRight size={24} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer do Cartaz - Rosa Vibrante */}
        <div className="bg-pink-600 p-8 text-center text-white relative">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Dúvidas e Informações</p>
              <a href={`https://wa.me/${ORGANIZER_PHONE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-lg font-black hover:text-yellow-200 transition">
                <Phone size={18}/> {ORGANIZER_PHONE.replace('55', '')} (Amrtananda das)
              </a>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setShowPixModal(true)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all border border-white/20 flex items-center gap-2 text-sm font-bold">
                <Heart size={18} /> Apoiar
              </button>
              <button onClick={() => setView('login')} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10">
                <Lock size={18} />
              </button>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-center items-center gap-2 text-[10px] font-bold opacity-60 uppercase tracking-tighter">
            <span>Bhakti Chakor</span>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <span>Palhoça 2025/26</span>
          </div>
        </div>
      </div>

      {/* Pix Modal/Overlay */}
      {showPixModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-0 flex justify-end">
              <button onClick={() => setShowPixModal(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="px-8 pb-10">
              <PixSection />
              <Button onClick={() => setShowPixModal(false)} className="w-full mt-6" variant="primary">Fechar</Button>
            </div>
          </div>
        </div>
      )}

      <AiAssistant />
    </div>
  );
};

export default App;
