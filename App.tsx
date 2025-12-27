
import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Lock, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  Send, 
  User, 
  Utensils, 
  Info, 
  Phone,
  Sparkles
} from 'lucide-react';
import { AppView, RegistrationFormData, ParticipationDays } from './types';
import { 
  EVENT_INFO, 
  ADMIN_PASSWORD, 
  ORGANIZER_PHONE, 
  GOOGLE_SCRIPT_URL,
  BLOOD_TYPES 
} from './constants';
import { Input, Textarea } from './components/Input';
import { Button } from './components/Button';
import { AiAssistant } from './components/AiAssistant';
import AdminDashboard from './components/AdminDashboard';
import { getSpiritualGuidance } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('form');
  const [loading, setLoading] = useState(false);
  const [spiritualMessage, setSpiritualMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<RegistrationFormData>({
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

  // Explicitly using ParticipationDays keys to fix type inference issues
  const toggleDay = (day: keyof ParticipationDays) => {
    setFormData(prev => ({
      ...prev,
      days: { ...prev.days, [day]: !prev.days[day] }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedDaysList: string[] = [];
    if (formData.days.day31) selectedDaysList.push("31/Dez");
    if (formData.days.day01) selectedDaysList.push("01/Jan");
    if (formData.days.day02) selectedDaysList.push("02/Jan");

    if (selectedDaysList.length === 0) {
      alert("Por favor, selecione ao menos um dia de participação.");
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch AI Guidance (Gemini)
      const guidance = await getSpiritualGuidance(formData.civilName, `Desejo vir no evento nos dias ${selectedDaysList.join(', ')}`);
      setSpiritualMessage(guidance);

      // 2. Google Sheets Integration
      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            selectedDays: selectedDaysList.join(', '),
            timestamp: new Date().toISOString()
          })
        });
      }

      // 3. WhatsApp Redirect
      const message = `*Inscrição - Ano Novo Transcendental* 🌸\n` +
        `*Com Srila Gurudeva Vana Goswami Maharaj*\n\n` +
        `*Nome:* ${formData.civilName} ${formData.spiritualName ? `(${formData.spiritualName})` : ''}\n` +
        `*RG:* ${formData.rg}\n` +
        `*Dias:* ${selectedDaysList.join(', ')}\n` +
        `*Restrições:* ${formData.restrictions || 'Nenhuma'}\n\n` +
        `_Enviado pelo App Oficial_`;

      window.open(`https://wa.me/${ORGANIZER_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
      
      setView('success');
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao processar sua inscrição. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // --- Views ---

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Área Administrativa</h2>
          <p className="text-slate-500 mb-8 text-sm">Somente para organizadores autorizados.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const pass = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
            if (pass === ADMIN_PASSWORD) setView('admin');
            else alert('Senha incorreta!');
          }} className="space-y-4">
            <Input name="password" type="password" placeholder="Senha de Acesso" required />
            <Button className="w-full">Entrar no Painel</Button>
            <button onClick={() => setView('form')} type="button" className="text-sm text-slate-400 hover:text-slate-600 underline">Voltar para Inscrição</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return <AdminDashboard onBack={() => setView('form')} />;
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center border-t-8 border-amber-600">
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-800 mb-4 font-serif">Hare Krishna! 🙏</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Sua inscrição foi iniciada com sucesso. Se o seu WhatsApp abriu, **não esqueça de enviar a mensagem** para confirmar sua presença com os organizadores.
          </p>

          {spiritualMessage && (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 mb-8 relative">
              <Sparkles className="absolute -top-3 -right-3 text-amber-500 bg-white rounded-full p-1" size={24} />
              <p className="text-amber-900 font-medium italic">"{spiritualMessage}"</p>
              <p className="text-xs text-amber-700/50 mt-2">— Assistente de IA</p>
            </div>
          )}

          <Button onClick={() => setView('form')} variant="outline" className="w-full">Realizar Nova Inscrição</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-amber-50/30">
      {/* Header / Hero */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src="https://picsum.photos/id/1022/1920/1080?blur=2" 
          alt="Transcendental New Year Background"
          className="absolute inset-0 w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/90 via-amber-900/40 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 mt-10">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-full mb-6 border border-white/20">
            <Leaf size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-xl font-serif">
            {EVENT_INFO.title}
          </h1>
          <p className="text-xl md:text-2xl text-amber-100 font-medium mb-6">
            Com {EVENT_INFO.guest}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm border border-white/30">
              <Calendar size={16} /> {EVENT_INFO.dates}
            </span>
            <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm border border-white/30">
              <MapPin size={16} /> {EVENT_INFO.location}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto -mt-20 px-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-4 bg-blue-600 text-white text-center text-sm font-semibold flex items-center justify-center gap-2">
            <Info size={16} /> Day Use Gratuito • Colabore na Inscrição para o Prasadam
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
            {/* Step 1: Identity */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <User size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Dados de Identificação</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Nome Civil Completo *" 
                  name="civilName" 
                  value={formData.civilName} 
                  onChange={handleInputChange} 
                  placeholder="Seu nome oficial" 
                  required 
                />
                <Input 
                  label="Nome Espiritual" 
                  name="spiritualName" 
                  value={formData.spiritualName} 
                  onChange={handleInputChange} 
                  placeholder="Nome dado pelo mestre (se houver)" 
                />
                <Input 
                  label="RG *" 
                  name="rg" 
                  value={formData.rg} 
                  onChange={handleInputChange} 
                  placeholder="Documento de Identidade" 
                  required 
                />
                <Input 
                  label="WhatsApp *" 
                  name="phone" 
                  type="tel"
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  placeholder="(DDD) 9 0000-0000" 
                  required 
                />
              </div>
            </section>

            {/* Step 2: Logistics & Prasadam */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Utensils size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Presença e Saúde</h2>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700 block">Em quais dias você participará? *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Fixed: Use as const to ensure literal types for d.id, matching ParticipationDays keys */}
                  {([
                    { id: 'day31', label: '31/Dez', sub: 'Virada' },
                    { id: 'day01', label: '01/Jan', sub: 'Novo Ciclo' },
                    { id: 'day02', label: '02/Jan', sub: 'Encerramento' }
                  ] as const).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden ${
                        formData.days[d.id] 
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-600/30' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-lg font-bold">{d.label}</span>
                      <span className={`text-xs ${formData.days[d.id] ? 'text-amber-100' : 'text-slate-400'}`}>{d.sub}</span>
                      {formData.days[d.id] && (
                        <div className="absolute top-2 right-2"><CheckCircle size={16} /></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Tipo Sanguíneo</label>
                  <select 
                    name="bloodType" 
                    value={formData.bloodType} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-none transition-all"
                  >
                    <option value="">Selecione...</option>
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Textarea 
                    label="Restrições Alimentares / Alergias" 
                    name="restrictions" 
                    value={formData.restrictions} 
                    onChange={handleInputChange} 
                    placeholder="Ex: Vegano, Alérgico a amendoim, Sem lactose..." 
                  />
                </div>
              </div>
            </section>

            <Button 
              type="submit" 
              isLoading={loading} 
              className="w-full h-16 text-xl rounded-2xl shadow-2xl"
            >
              <Send className="mr-3" size={24} /> Confirmar Minha Presença
            </Button>
          </form>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm space-y-4">
          <p>© 2025 Ano Novo Transcendental • Hare Krishna Bhakti Yoga</p>
          <div className="flex justify-center items-center gap-6">
            <button onClick={() => setView('login')} className="flex items-center gap-2 hover:text-amber-600 transition-colors">
              <Lock size={14} /> Portal do Organizador
            </button>
            <a href={`https://wa.me/${ORGANIZER_PHONE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-600 transition-colors">
              <Phone size={14} /> Suporte WhatsApp
            </a>
          </div>
        </footer>
      </main>

      <AiAssistant />
    </div>
  );
};

export default App;
