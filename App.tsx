
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
  Wallet,
  QrCode,
  Sparkles,
  Quote
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
    days: { day30: false, day31: false, day01: false, day02: false, day03: false }
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
      selectedDaysList.push("Hospedagem (Pacote 5 dias)");
    } else {
      if (formData.days.day30) selectedDaysList.push("30/Dez");
      if (formData.days.day31) selectedDaysList.push("31/Dez (Virada)");
      if (formData.days.day01) selectedDaysList.push("01/Jan");
      if (formData.days.day02) selectedDaysList.push("02/Jan");
      if (formData.days.day03) selectedDaysList.push("03/Jan");
    }

    const payload = { 
      ...formData, 
      selectedDays: selectedDaysList.join(', '),
      timestamp: new Date().toLocaleString('pt-BR')
    };

    try {
      // Chamada assíncrona para a IA
      const guidancePromise = getSpiritualGuidance(
        formData.spiritualName || formData.civilName.split(' ')[0], 
        `Tipo de participação: ${formData.participationType === 'hosting' ? 'Hospedagem' : 'Day Use'}.`
      );

      // Tentativa de envio para o Google Sheets com melhor tratamento de erro
      let sheetSuccess = false;
      if (GOOGLE_SCRIPT_URL) {
        try {
          // Usando fetch padrão sem no-cors para permitir JSON, ou lidando com as limitações do GAS
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            // Nota: GAS redireciona, o fetch segue por padrão. 
            // 'no-cors' impede a leitura do corpo mas evita erros de preflight se o servidor não suportar.
            // Aqui optamos por deixar o navegador gerenciar, já que GAS suporta redirecionamentos.
          });
          sheetSuccess = true;
        } catch (error) {
          console.error("Erro ao enviar para Google Sheets:", error);
          // Não bloqueamos o sucesso total pois o WhatsApp é o canal oficial
        }
      }

      const guidance = await guidancePromise;
      setSpiritualMessage(guidance ?? null);

      const message = `*Inscrição - ${EVENT_INFO.title}* 🌸\n` +
        `*Participação:* ${formData.participationType === 'hosting' ? 'Hospedagem' : 'Day Use'}\n` +
        `*Reserva:* ${formData.hostingStatus === 'paid' ? 'Já pago' : formData.hostingStatus === 'reserving' ? 'Vou reservar' : 'N/A'}\n` +
        `*Nome:* ${formData.civilName} ${formData.spiritualName ? `(${formData.spiritualName})` : ''}\n` +
        `*RG:* ${formData.rg}\n` +
        `*Dias:* ${payload.selectedDays}\n` +
        `*Restrições:* ${formData.restrictions || 'Nenhuma'}\n\n` +
        `_Enviado pelo App Oficial_`;

      window.open(`https://wa.me/${ORGANIZER_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
      setView('success');
    } catch (error) {
      console.error("Erro geral no submit:", error);
      alert("Houve um problema ao processar sua inscrição. Por favor, tente novamente ou contate o suporte.");
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
            className="shrink-0 p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
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
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
          <Lock size={24} />
        </div>
        <h2 className="text-xl font-bold mb-4 text-gray-800 font-serif">Acesso Administrativo</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const p = (e.currentTarget.elements.namedItem('pass') as HTMLInputElement).value;
          if (p === ADMIN_PASSWORD) setView('admin');
          else alert('Senha incorreta');
        }}>
          <input name="pass" type="password" placeholder="Senha" className="w-full border p-3 rounded-xl mb-4 text-center" required />
          <Button className="w-full">Entrar</Button>
        </form>
        <button onClick={() => setView('form')} className="mt-4 text-gray-500 text-sm hover:underline">Voltar</button>
      </div>
    </div>
  );

  if (view === 'admin') return <AdminDashboard onBack={() => setView('form')} />;

  if (view === 'success') return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-amber-500 space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div>
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 font-serif">Inscrição Iniciada! 🙏</h2>
          <p className="text-slate-500 text-sm">Se o WhatsApp abriu, envie a mensagem para confirmar sua vaga.</p>
        </div>
        
        {spiritualMessage && (
          <div className="relative group">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
              <Sparkles size={10} /> Mensagem para você
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 text-amber-900 text-sm relative overflow-hidden shadow-sm">
              <Quote className="absolute -top-2 -left-2 text-amber-200/50" size={48} />
              <p className="relative z-10 font-medium leading-relaxed italic">
                {spiritualMessage}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-amber-700/50 uppercase tracking-widest font-bold">
                Personalizado por IA Transcendental
              </div>
            </div>
          </div>
        )}

        <PixSection />

        <div className="pt-4">
          <Button variant="outline" onClick={() => { setView('form'); setStep(1); setSpiritualMessage(null); }} className="w-full">
            Fazer outra inscrição
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-50 py-8 px-4 font-sans flex flex-col items-center">
      {showPixModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 flex justify-end">
              <button onClick={() => setShowPixModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="px-6 pb-8">
              <PixSection />
              <Button onClick={() => setShowPixModal(false)} className="w-full mt-6" variant="primary">Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {showHostingSuggestion && (
        <div className="fixed inset-0 z-[110] bg-amber-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-t-8 border-amber-500 p-8 text-center space-y-6">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 font-serif">Experiência Completa!</h3>
              <p className="text-slate-600 mt-2">
                Notamos que você pretende vir em todos os dias do retiro. 
                Que tal se hospedar conosco para uma imersão total? 
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl text-left border border-amber-100">
              <p className="text-amber-900 font-bold text-sm">Vantagens do Pacote:</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1">
                <li>• Pernoite no local (rancho paradisíaco)</li>
                <li>• Todas as refeições inclusas (Café, Almoço, Jantar)</li>
                <li>• Participação nas orações matinais (Mangala Arati)</li>
                <li>• Convívio direto com Srila Gurudeva</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, participationType: 'hosting' }));
                setShowHostingSuggestion(false);
              }}>
                Quero o Pacote de Hospedagem
              </Button>
              <button onClick={() => setShowHostingSuggestion(false)} className="text-sm text-slate-400 hover:text-slate-600 underline">
                Continuar com Day Use
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-100">
        <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-8 text-center relative">
          <div className="absolute top-4 left-4 opacity-30 text-white"><Leaf size={40} /></div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white drop-shadow-md font-serif">{EVENT_INFO.title}</h1>
          <p className="text-lg text-amber-100 font-medium">{EVENT_INFO.venue} • {EVENT_INFO.guest}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1 rounded-full text-xs backdrop-blur-sm font-bold">
              <Calendar size={14}/> {EVENT_INFO.dates}
            </span>
            <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1 rounded-full text-xs backdrop-blur-sm font-bold">
              <Clock size={14}/> Início 18:00
            </span>
            <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1 rounded-full text-xs backdrop-blur-sm font-bold">
              <MapPin size={14}/> {EVENT_INFO.location}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 flex gap-3 text-sm text-blue-800">
            <Info size={18} className="shrink-0" />
            <span>{step === 1 ? 'Selecione como deseja participar para calcularmos o Prasadam.' : 'Preencha seus dados para finalizar a inscrição.'}</span>
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2 border-b pb-2"><Home size={20}/> Hospedagem</h3>
              
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participationType: 'hosting' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${formData.participationType === 'hosting' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div>
                    <p className="font-bold text-gray-800">Vou me hospedar (Completo)</p>
                    <p className="text-xs text-gray-500">Pacote {ACCOMMODATION_CONFIG.days} - R$ {ACCOMMODATION_CONFIG.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  {formData.participationType === 'hosting' && <CheckCircle className="text-amber-600" size={20} />}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participationType: 'dayuse', hostingStatus: null }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${formData.participationType === 'dayuse' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div>
                    <p className="font-bold text-gray-800">Day Use (Apenas visitar)</p>
                    <p className="text-xs text-gray-500">Vou para as atividades e volto pra casa</p>
                  </div>
                  {formData.participationType === 'dayuse' && <CheckCircle className="text-amber-600" size={20} />}
                </button>
              </div>

              {formData.participationType === 'hosting' && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                  <p className="text-center font-bold text-blue-900 text-sm">Já tem reserva confirmada?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, hostingStatus: 'paid' }))} className={`py-2 rounded-xl font-bold text-sm border-2 ${formData.hostingStatus === 'paid' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-100'}`}>Sim, já paguei</button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, hostingStatus: 'reserving' }))} className={`py-2 rounded-xl font-bold text-sm border-2 ${formData.hostingStatus === 'reserving' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-100'}`}>Vou reservar</button>
                  </div>

                  {formData.hostingStatus === 'reserving' && (
                    <div className="bg-white rounded-xl p-4 border border-blue-100 space-y-3">
                      <p className="text-emerald-600 text-xs font-bold flex items-center gap-1"><Check size={14}/> Dados para PIX</p>
                      <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center group">
                        <span className="text-xs font-mono text-gray-600 truncate">{ACCOMMODATION_CONFIG.pixKey}</span>
                        <button type="button" onClick={() => copyText(ACCOMMODATION_CONFIG.pixKey)} className="text-blue-500 hover:text-blue-700 transition-colors">
                          {copied ? <Check size={16}/> : <Copy size={16}/>}
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-500 leading-tight">
                        <p><strong>Nome:</strong> {ACCOMMODATION_CONFIG.pixName}</p>
                        <p className="text-emerald-600 font-bold mt-1">Valor: R$ {ACCOMMODATION_CONFIG.price.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.participationType === 'dayuse' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <p className="text-sm font-bold text-gray-700">Quais dias virá? (Para o Prasadam)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'day30', label: '30 Dez', sub: 'Segunda' },
                      { id: 'day31', label: '31 Dez', sub: 'Terça' },
                      { id: 'day01', label: '01 Jan', sub: 'Quarta' },
                      { id: 'day02', label: '02 Jan', sub: 'Quinta' },
                      { id: 'day03', label: '03 Jan', sub: 'Sexta' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDayChange(d.id as keyof ParticipationDays)}
                        className={`p-2 rounded-xl border-2 text-center transition-all ${formData.days[d.id as keyof ParticipationDays] ? 'border-amber-500 bg-amber-50 font-bold text-amber-900 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
                      >
                        <span className="text-xs sm:text-sm">{d.label}</span>
                        <p className="text-[9px] opacity-60 font-normal">{d.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2 border-b pb-2"><User size={20}/> Seus Dados</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input required name="civilName" label="Nome Completo *" value={formData.civilName} onChange={handleInputChange} placeholder="Seu nome oficial" />
                <Input name="spiritualName" label="Nome Espiritual" value={formData.spiritualName} onChange={handleInputChange} placeholder="Se houver" />
                <Input required name="rg" label="RG *" value={formData.rg} onChange={handleInputChange} placeholder="Documento" />
                <Input required type="tel" name="phone" label="WhatsApp *" value={formData.phone} onChange={handleInputChange} placeholder="(DDD) 9..." />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Tipo Sanguíneo</label>
                  <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-none">
                    <option value="">Selecione...</option>
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Textarea name="restrictions" label="Restrições Alimentares" value={formData.restrictions} onChange={handleInputChange} placeholder="Alergias, Vegano, etc." />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t flex gap-3">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="p-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all">
                <ArrowLeft size={24} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2 text-lg disabled:opacity-50"
            >
              {loading ? 'Processando...' : (
                <>
                  {step === 1 ? 'Próximo Passo' : 'Confirmar Presença'}
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <footer className="text-center mt-12 text-amber-800/60 text-sm space-y-4 px-4 pb-8">
        <p className="font-medium tracking-wide">Hare Krishna • Palhoça, SC 2025</p>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
          <button 
            onClick={() => setShowPixModal(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-700 rounded-full transition-all group font-bold"
          >
            <Heart size={14} className="group-hover:scale-125 transition-transform" fill="currentColor" />
            Apoiar o Evento
          </button>
          <a href={`https://wa.me/${ORGANIZER_PHONE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-600 transition">
            <Phone size={12} /> Suporte
          </a>
          <button onClick={() => setView('login')} className="flex items-center gap-1 hover:text-amber-800 transition">
            <Lock size={12} /> Painel Admin
          </button>
        </div>
      </footer>
      <AiAssistant />
    </div>
  );
};

export default App;
