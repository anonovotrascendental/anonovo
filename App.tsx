
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Phone, 
  Info, 
  CheckCircle, 
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
  UtensilsCrossed,
  Sparkle,
  ShieldCheck,
  Car,
  Users2,
  Wallet,
  HandHeart
} from 'lucide-react';
import { AppView, RegistrationFormData, ParticipationDays } from './types';
import { 
  EVENT_INFO, 
  ADMIN_PASSWORD, 
  ORGANIZER_PHONE, 
  GOOGLE_SCRIPT_URL,
  BLOOD_TYPES,
  ACCOMMODATION_CONFIG,
  PIX_CONFIG,
  TRANSPORT_OPTIONS
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
  const [countdown, setCountdown] = useState(7);

  const [formData, setFormData] = useState<RegistrationFormData>({
    participationType: null,
    hostingStatus: null,
    spiritualName: '',
    civilName: '',
    rg: '',
    phone: '',
    bloodType: '',
    restrictions: '',
    days: { day31: false, day01: false, day02: false },
    transportationMethod: '',
    groupSize: 1
  });

  const getWhatsAppLink = () => {
    const selectedDaysList: string[] = [];
    if (formData.participationType === 'hosting') {
      selectedDaysList.push("Hospedagem (Pacote Completo)");
    } else {
      if (formData.days.day31) selectedDaysList.push("31/Dez");
      if (formData.days.day01) selectedDaysList.push("01/Jan");
      if (formData.days.day02) selectedDaysList.push("02/Jan");
    }

    const message = `*VALIDAÇÃO DE INSCRIÇÃO - ${EVENT_INFO.title}* 🌸\n\n` +
      `*Mestre:* ${EVENT_INFO.guest}\n` +
      `*Participação:* ${formData.participationType === 'hosting' ? 'Hospedagem 🏠' : 'Day Use ☀️'}\n` +
      `*Reserva:* ${formData.hostingStatus === 'paid' ? 'Já pago ✅' : formData.hostingStatus === 'reserving' ? 'Vou reservar ⏳' : 'N/A'}\n` +
      `*Inscrito:* ${formData.civilName} ${formData.spiritualName ? `(${formData.spiritualName})` : ''}\n` +
      `*WhatsApp:* ${formData.phone}\n` +
      `*Transporte:* ${formData.transportationMethod}\n` +
      `*Grupo:* ${formData.groupSize} pessoa(s)\n` +
      `*Dias:* ${selectedDaysList.join(', ')}\n` +
      `*Saúde:* Sangue ${formData.bloodType || '?'}, Restr: ${formData.restrictions || 'Nenhuma'}\n\n` +
      `_Estou enviando esta mensagem para VALIDAR meu cadastro oficial._`;

    return `https://wa.me/${ORGANIZER_PHONE}?text=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    let timer: number;
    if (view === 'success' && countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (view === 'success' && countdown === 0) {
      window.location.href = getWhatsAppLink();
    }
    return () => clearInterval(timer);
  }, [view, countdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: val }));
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

    if (!formData.transportationMethod) {
      alert("Por favor, selecione seu meio de transporte.");
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

    // Explicit payload to match GAS expectations
    const payload = { 
      civilName: formData.civilName,
      spiritualName: formData.spiritualName,
      participationType: formData.participationType,
      hostingStatus: formData.hostingStatus,
      rg: formData.rg,
      phone: formData.phone,
      bloodType: formData.bloodType,
      restrictions: formData.restrictions,
      transportationMethod: formData.transportationMethod,
      groupSize: formData.groupSize,
      selectedDays: selectedDaysList.join(', '),
      timestamp: new Date().toLocaleString('pt-BR')
    };

    try {
      const guidancePromise = getSpiritualGuidance(
        formData.spiritualName || formData.civilName.split(' ')[0], 
        `Evento: ${EVENT_INFO.title}. Mestre: ${EVENT_INFO.guest}.`
      );

      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // standard way to bypass CORS for GAS
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });
      }

      const guidance = await guidancePromise;
      setSpiritualMessage(guidance ?? null);
      setCountdown(7); 
      setView('success');
    } catch (error) {
      console.error("Submission error:", error);
      alert("Erro ao processar sua inscrição. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  const PixSection = ({ className = "", title = "Dados para Pagamento", subtitle = "Use a chave abaixo para realizar sua reserva ou contribuição via PIX." }: { className?: string, title?: string, subtitle?: string }) => (
    <div className={`bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-center space-y-4 ${className}`}>
      <div className="flex justify-center">
        <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 shadow-inner">
          <Wallet size={32} className="animate-pulse" />
        </div>
      </div>
      <div>
        <h4 className="font-black text-emerald-900 text-lg uppercase tracking-tight">{title}</h4>
        <p className="text-xs text-emerald-700/70 mt-1 leading-tight font-medium">{subtitle}</p>
      </div>
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 space-y-4">
        <div className="space-y-3 text-left">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Chave PIX (E-mail)</p>
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-sm font-mono text-slate-700 truncate font-bold">{PIX_CONFIG.key}</p>
              <button 
                type="button" 
                onClick={() => copyText(PIX_CONFIG.key)}
                className="shrink-0 p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors ml-2"
              >
                {copied ? <Check size={18}/> : <Copy size={18}/>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-slate-50 pt-3">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Favorecido / Recebedor</span>
                <span className="text-xs font-bold text-slate-700">{ACCOMMODATION_CONFIG.pixName}</span>
                <span className="text-[9px] text-slate-400 font-medium">{PIX_CONFIG.receiver}</span>
             </div>
             <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Banco</span>
                  <span className="text-xs font-bold text-slate-700">{ACCOMMODATION_CONFIG.pixBank}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Valor (Hospedagem)</span>
                  <span className="text-xs font-bold text-emerald-600">R$ {ACCOMMODATION_CONFIG.price.toFixed(2)}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div className="min-h-screen bg-[#0a3055] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-sm text-center border-b-4 border-amber-500">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold mb-6 font-serif text-[#0a3055]">Painel de Gestão</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const p = (e.currentTarget.elements.namedItem('pass') as HTMLInputElement).value;
          if (p === ADMIN_PASSWORD) setView('admin');
          else alert('Senha incorreta');
        }}>
          <input name="pass" type="password" placeholder="Senha Administrativa" className="w-full border-2 border-slate-100 p-4 rounded-xl mb-4 text-center focus:border-blue-500 outline-none transition-all" required autoFocus />
          <Button className="w-full py-4 text-lg" variant="secondary">Entrar no Painel</Button>
        </form>
        <button onClick={() => setView('form')} className="mt-6 text-slate-400 text-sm hover:underline">Voltar para o formulário</button>
      </div>
    </div>
  );

  if (view === 'admin') return <AdminDashboard onBack={() => setView('form')} />;

  if (view === 'success') return (
    <div className="min-h-screen bg-[#0a3055] py-8 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-[45px] shadow-2xl max-w-lg w-full text-center border-t-[14px] border-[#ec4899] space-y-6 animate-in zoom-in-95 duration-500">
        <div className="relative inline-block">
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
            <ShieldCheck size={56} className="animate-bounce" />
          </div>
          <div className="absolute -top-2 -right-2 bg-[#ec4899] text-white p-2 rounded-full shadow-lg">
            <Sparkles size={16} />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-[#0a3055] mb-2 font-serif uppercase tracking-tight leading-none">Dados Recebidos!</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest bg-slate-100 py-1 px-4 rounded-full inline-block">Falta apenas 1 etapa</p>
        </div>
        {spiritualMessage && (
          <div className="bg-blue-50/50 p-6 rounded-[35px] border border-blue-100 text-[#0a3055] text-sm relative italic font-medium leading-relaxed shadow-sm">
            <Quote className="absolute -top-3 -left-3 text-blue-200" size={32} />
            {spiritualMessage}
            <div className="mt-2 text-[10px] uppercase tracking-widest text-blue-400 font-bold not-italic">Sua Benção de Ano Novo</div>
          </div>
        )}
        <div className="bg-emerald-50 p-8 rounded-[40px] border-2 border-emerald-100 space-y-5 relative overflow-hidden group">
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-black text-emerald-800 uppercase text-lg tracking-tighter">Validação Obrigatória</h3>
            <p className="text-emerald-700/60 text-xs font-medium max-w-[240px] mx-auto">
              Para oficializar sua presença e garantir seu Prasadam, envie seus dados para nossa equipe agora.
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = getWhatsAppLink()} 
              className="w-full py-6 text-xl rounded-[25px] shadow-xl bg-emerald-600 hover:bg-emerald-700 border-none animate-pulse hover:animate-none group"
            >
              <div className="flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-lg"><Phone size={24} /></span>
                VALIDAR NO WHATSAPP
              </div>
            </Button>
            <div className="flex items-center justify-center gap-3">
              <div className="h-1 flex-1 bg-emerald-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${((7 - countdown) / 7) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tabular-nums">Envio automático em {countdown}s</span>
            </div>
          </div>
        </div>

        <PixSection 
          title="Contribuição Voluntária" 
          subtitle="Sua doação ajuda no Prasadam e logística do festival. Agradecemos imensamente seu apoio!"
          className="scale-95 opacity-90 hover:opacity-100 transition-opacity"
        />

        <div className="pt-2">
          <button 
            onClick={() => { setView('form'); setStep(1); }} 
            className="text-slate-300 text-[10px] font-black hover:text-slate-500 uppercase tracking-[0.3em] transition-colors border-b border-transparent hover:border-slate-300 pb-1"
          >
            Realizar Outra Inscrição
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-0 font-sans flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white shadow-2xl overflow-hidden min-h-screen flex flex-col">
        
        <div className="bg-[#0a3055] p-8 md:p-12 text-center relative overflow-hidden border-b-8 border-[#ec4899]">
          <h2 className="text-white text-lg md:text-xl font-bold tracking-widest uppercase mb-4 opacity-90 drop-shadow">
            {EVENT_INFO.title}
          </h2>
          <div className="mb-2">
            <span className="text-blue-200 text-xs uppercase tracking-[0.2em]">Com a presença ilustre de</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-[#facc15] font-serif leading-tight drop-shadow-lg">
            {EVENT_INFO.guest}
          </h1>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {EVENT_INFO.activities.map(act => (
              <span key={act} className="px-3 py-1 bg-white/10 rounded-full text-white text-[10px] uppercase font-bold border border-white/20 backdrop-blur-sm">
                {act}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2 text-white">
            <div className="flex items-center gap-2 bg-[#ec4899] px-6 py-2 rounded-full font-black text-lg shadow-xl">
              <Calendar size={20} />
              {EVENT_INFO.dates} a partir das {EVENT_INFO.startTime}h
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-10 space-y-8 bg-white">
          <div className="flex items-center justify-between border-b pb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md ${step === 1 ? 'bg-[#ec4899] text-white' : 'bg-green-500 text-white'}`}>
                {step === 1 ? '1' : <Check size={20}/>}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[#0a3055] uppercase text-xs tracking-wider">Passo 01</span>
                <span className={`text-sm font-bold ${step === 1 ? 'text-slate-800' : 'text-slate-400'}`}>Participação</span>
              </div>
            </div>
            <div className="w-12 h-1 bg-slate-100 rounded-full"></div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md ${step === 2 ? 'bg-[#ec4899] text-white' : 'bg-slate-100 text-slate-400'}`}>
                2
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-400 uppercase text-xs tracking-wider">Passo 02</span>
                <span className={`text-sm font-bold ${step === 2 ? 'text-slate-800' : 'text-slate-400'}`}>Seus Dados</span>
              </div>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participationType: 'hosting' }))}
                  className={`p-6 rounded-[30px] border-2 text-left transition-all flex justify-between items-center group ${formData.participationType === 'hosting' ? 'border-[#ec4899] bg-pink-50/50 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`p-4 rounded-2xl shadow-sm ${formData.participationType === 'hosting' ? 'bg-[#ec4899] text-white' : 'bg-white text-slate-400'}`}>
                      <Home size={28} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg">Hospedagem Completa</p>
                      <p className="text-xs text-slate-500 font-medium">Imersão Total: {EVENT_INFO.fullDates}</p>
                    </div>
                  </div>
                  {formData.participationType === 'hosting' && <CheckCircle className="text-[#ec4899]" size={28} />}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participationType: 'dayuse', hostingStatus: null }))}
                  className={`p-6 rounded-[30px] border-2 text-left transition-all flex justify-between items-center group ${formData.participationType === 'dayuse' ? 'border-blue-500 bg-blue-50/50 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`p-4 rounded-2xl shadow-sm ${formData.participationType === 'dayuse' ? 'bg-blue-500 text-white' : 'bg-white text-slate-400'}`}>
                      <Clock size={28} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg">Day Use (Apenas Visita)</p>
                      <p className="text-xs text-slate-500 font-medium">Entrada livre para as atividades</p>
                    </div>
                  </div>
                  {formData.participationType === 'dayuse' && <CheckCircle className="text-blue-600" size={28} />}
                </button>
              </div>

              {formData.participationType === 'hosting' && (
                <div className="bg-pink-50/30 rounded-[35px] p-8 border border-pink-100 space-y-6 animate-in zoom-in-95">
                  <div className="text-center space-y-1">
                    <p className="font-black text-[#ec4899] uppercase text-xs tracking-[0.2em]">Confirmação de Reserva</p>
                    <p className="text-slate-600 text-sm">A hospedagem requer reserva prévia.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, hostingStatus: 'paid' }))} className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${formData.hostingStatus === 'paid' ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-xl scale-105' : 'bg-white text-[#ec4899] border-pink-100 hover:border-pink-300'}`}>Já Paguei</button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData(prev => ({ ...prev, hostingStatus: 'reserving' }));
                        setShowPixModal(true);
                      }} 
                      className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${formData.hostingStatus === 'reserving' ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-xl scale-105' : 'bg-white text-[#ec4899] border-pink-100 hover:border-pink-300'}`}
                    >
                      Vou Pagar
                    </button>
                  </div>
                </div>
              )}

              {formData.participationType === 'dayuse' && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3 text-blue-700 font-black uppercase text-xs tracking-widest bg-blue-50 px-4 py-2 rounded-full w-fit">
                    <Calendar size={16}/>
                    <span>Selecione seus dias de presença</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'day31', label: '31 Dez', sub: 'Mantras & Virada' },
                      { id: 'day01', label: '01 Jan', sub: 'Imersão' },
                      { id: 'day02', label: '02 Jan', sub: 'Encerramento' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDayChange(d.id as keyof ParticipationDays)}
                        className={`p-5 rounded-[25px] border-2 text-center transition-all flex flex-col items-center gap-1 ${formData.days[d.id as keyof ParticipationDays] ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200'}`}
                      >
                        <span className={`text-base font-black ${formData.days[d.id as keyof ParticipationDays] ? 'text-blue-900' : ''}`}>{d.label}</span>
                        <p className="text-[10px] opacity-70 uppercase font-bold tracking-tight">{d.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-8 shadow-inner">
                {/* Perfil & Saúde */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] flex items-center gap-2">
                    <User size={14} className="text-[#ec4899]" /> Identificação & Saúde
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input required name="civilName" label="Nome Completo *" value={formData.civilName} onChange={handleInputChange} placeholder="Como no documento" icon={<User size={14}/>} />
                    <Input name="spiritualName" label="Nome Espiritual" value={formData.spiritualName} onChange={handleInputChange} placeholder="Ex: Sri Krishna Das" icon={<Sparkles size={14}/>} />
                    <Input required name="rg" label="RG / Documento *" value={formData.rg} onChange={handleInputChange} placeholder="Para identificação" icon={<Lock size={14}/>} />
                    <Input required type="tel" name="phone" label="WhatsApp *" value={formData.phone} onChange={handleInputChange} placeholder="(DDD) 9...." icon={<Phone size={14}/>} />
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-tighter flex items-center gap-2">
                        <Heart size={14} className="text-red-400" /> Tipo Sanguíneo
                      </label>
                      <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700">
                        <option value="">Selecione...</option>
                        {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Textarea name="restrictions" label="Restrições Alimentares / Saúde" value={formData.restrictions} onChange={handleInputChange} placeholder="Alergias, Vegano, Medicamentos..." icon={<UtensilsCrossed size={14}/>} />
                    </div>
                  </div>
                </div>

                {/* Logística de Transporte */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] flex items-center gap-2">
                    <Car size={14} className="text-[#ec4899]" /> Transporte
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-tighter flex items-center gap-2">
                        <Car size={14} className="text-blue-500" /> Como você virá? *
                      </label>
                      <select name="transportationMethod" required value={formData.transportationMethod} onChange={handleInputChange} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700">
                        <option value="">Selecione o transporte...</option>
                        {TRANSPORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <Input required type="number" name="groupSize" label="Total de pessoas no grupo *" value={formData.groupSize} onChange={handleInputChange} min="1" icon={<Users2 size={14}/>} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 flex gap-4">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="p-5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all shadow-sm">
                <ArrowLeft size={28} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 font-black py-5 rounded-[25px] shadow-2xl transition transform active:scale-95 flex justify-center items-center gap-3 text-xl disabled:opacity-50 ${step === 1 ? 'bg-[#0a3055] text-white hover:bg-blue-900' : 'bg-[#ec4899] text-white hover:bg-pink-700'}`}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sincronizando...
                </div>
              ) : (
                <>
                  {step === 1 ? 'Continuar Inscrição' : 'Finalizar e Validar no WhatsApp'}
                  <ChevronRight size={24} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="bg-[#ec4899] p-10 text-center text-white relative">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-left space-y-4">
              <div>
                <p className="text-[11px] uppercase font-black tracking-[0.2em] opacity-80 mb-2">Suporte & Informações</p>
                <a href={`https://wa.me/${ORGANIZER_PHONE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xl font-black hover:text-yellow-200 transition group">
                  <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Phone size={20}/>
                  </div>
                  {ORGANIZER_PHONE.replace('55', '')} (Amrtananda das)
                </a>
              </div>
              <button 
                onClick={() => setShowPixModal(true)} 
                className="flex items-center gap-2 text-xs font-bold opacity-70 hover:opacity-100 transition-opacity hover:underline"
              >
                <HandHeart size={14} /> Apoiar o Festival via PIX
              </button>
            </div>
            <div className="flex gap-4">
               <button onClick={() => setShowPixModal(true)} title="Doação PIX" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10">
                <Wallet size={20} />
              </button>
              <button onClick={() => setView('login')} title="Admin" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10">
                <Lock size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPixModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-t-8 border-emerald-500">
            <div className="p-6 pb-2 flex justify-end">
              <button onClick={() => setShowPixModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="px-8 pb-10">
              <PixSection />
              <Button onClick={() => setShowPixModal(false)} className="w-full mt-6 py-4 rounded-2xl" variant="success">Entendi, Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {showHostingSuggestion && (
        <div className="fixed inset-0 z-[110] bg-[#0a3055]/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[50px] shadow-2xl overflow-hidden border-t-[12px] border-[#ec4899] p-10 text-center space-y-8">
            <div className="bg-pink-100 w-24 h-24 rounded-[30px] flex items-center justify-center mx-auto text-[#ec4899] shadow-inner rotate-3">
              <Sparkles size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-[#0a3055] font-serif uppercase tracking-tight">Imersão Total?</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Vimos que você virá todos os dias! Que tal a experiência completa de hospedagem no Rancho Serra Mar?
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, participationType: 'hosting' }));
                setShowHostingSuggestion(false);
              }} className="py-5 text-lg rounded-[25px]">
                Mudar para Hospedagem
              </Button>
              <button onClick={() => setShowHostingSuggestion(false)} className="text-sm font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
                Continuar com Day Use
              </button>
            </div>
          </div>
        </div>
      )}

      <AiAssistant />
    </div>
  );
};

export default App;
