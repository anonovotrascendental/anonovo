
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  Download, 
  ChevronLeft, 
  Filter, 
  AlertTriangle,
  Database,
  RefreshCw,
  Clock,
  ExternalLink,
  Home,
  AlertCircle,
  CheckCircle2,
  Car,
  Plane,
  Bus,
  Handshake,
  Key,
  HelpCircle,
  User,
  Heart,
  Phone
} from 'lucide-react';
import { RegistrationRecord } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';
import { Button } from './Button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [data, setData] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    if (!GOOGLE_SCRIPT_URL) {
      setError("URL do Google Script não configurada.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use cache buster to ensure fresh data
      const separator = GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?';
      const urlWithCacheBuster = `${GOOGLE_SCRIPT_URL}${separator}t=${new Date().getTime()}`;
      const response = await fetch(urlWithCacheBuster);

      if (!response.ok) {
        throw new Error(`Erro na conexão: ${response.status}`);
      }
      
      const json = await response.json();
      
      if (json && json.error) {
        throw new Error(json.error);
      }
      
      setData(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Não foi possível carregar os dados. Verifique o Google Script.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    return {
      total: data.length,
      day31: data.filter(r => (r.selectedDays || '').includes('31/Dez')).length,
      day01: data.filter(r => (r.selectedDays || '').includes('01/Jan')).length,
      day02: data.filter(r => (r.selectedDays || '').includes('02/Jan')).length,
      hosting: data.filter(r => r.participationType === 'hosting').length,
      restrictions: data.filter(r => (r.restrictions || '').length > 3).length,
      totalPeople: data.reduce((acc, r) => acc + (Number(r.groupSize) || 1), 0),
      vehicles: data.filter(r => (r.transportationMethod || '').toLowerCase().includes('carro')).length
    };
  }, [data]);

  const filteredData = data.filter(r => 
    (r.civilName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.spiritualName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.rg || '').includes(searchTerm) ||
    (r.phone || '').includes(searchTerm)
  );

  const chartData = [
    { name: '31/Dez', count: stats.day31, color: '#f97316' },
    { name: '01/Jan', count: stats.day01, color: '#3b82f6' },
    { name: '02/Jan', count: stats.day02, color: '#10b981' },
    { name: 'Hosp.', count: stats.hosting, color: '#8b5cf6' },
  ];

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = ["Data Inscricao", "Nome Civil", "Nome Espiritual", "Tipo", "Reserva", "RG", "WhatsApp", "Transporte", "Grupo", "Dias", "Restricoes", "Tipo Sanguineo"];
    const rows = data.map(r => [
      r.timestamp || '',
      r.civilName, 
      r.spiritualName, 
      r.participationType === 'hosting' ? 'Hospedagem' : 'Day Use',
      r.hostingStatus === 'paid' ? 'Pago' : r.hostingStatus === 'reserving' ? 'Pendente' : 'N/A',
      r.rg, 
      r.phone, 
      r.transportationMethod,
      r.groupSize,
      r.selectedDays, 
      r.restrictions, 
      r.bloodType
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inscricoes_festival_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTransportIcon = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('próprio')) return <Car size={14} className="text-blue-500" />;
    if (m.includes('alugado')) return <Key size={14} className="text-slate-500" />;
    if (m.includes('ônibus/van')) return <Bus size={14} className="text-emerald-500" />;
    if (m.includes('carona')) return <Handshake size={14} className="text-amber-500" />;
    if (m.includes('rodoviário') || m.includes('avião')) return <Plane size={14} className="text-indigo-500" />;
    return <HelpCircle size={14} className="text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 rounded-2xl hover:bg-slate-50 text-slate-500 transition-colors border border-slate-100"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-amber-600" /> Painel Logístico
              </h1>
              <p className="text-sm text-slate-400">Consolidado do Google Sheets</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} isLoading={loading}>
              <RefreshCw size={16} className="mr-2" /> Atualizar
            </Button>
            <Button variant="success" size="sm" onClick={exportCSV} disabled={data.length === 0}>
              <Download size={16} className="mr-2" /> Exportar Planilha
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Pessoas" value={stats.totalPeople} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
          <StatCard title="Carros Est." value={stats.vehicles} icon={<Car className="text-emerald-600" />} color="bg-emerald-50" subValue="aprox." />
          <StatCard title="Hospedagem" value={stats.hosting} icon={<Home className="text-purple-600" />} color="bg-purple-50" />
          <StatCard title="Restrições" value={stats.restrictions} icon={<AlertTriangle className="text-red-600" />} color="bg-red-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-8">Demanda por Dia</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={30}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, documento ou whatsapp..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium"
                />
              </div>
            </div>
            <div className="flex-1 overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-5">Inscrito / Grupo</th>
                    <th className="px-6 py-5">Transporte</th>
                    <th className="px-6 py-5">Participação</th>
                    <th className="px-6 py-5">Saúde</th>
                    <th className="px-6 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.length > 0 ? filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
                              {row.civilName}
                              {row.spiritualName && <span className="text-[10px] text-blue-500 font-black uppercase ml-1 opacity-70">({row.spiritualName})</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                              Total: <span className="font-black text-slate-600">{row.groupSize || 1}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm text-xs font-bold text-slate-600 whitespace-nowrap">
                          {getTransportIcon(row.transportationMethod)}
                          <span>{row.transportationMethod || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter w-fit ${row.participationType === 'hosting' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {row.participationType === 'hosting' ? 'Hospedagem' : 'Day Use'}
                          </span>
                          {row.participationType === 'hosting' && (
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter w-fit ${row.hostingStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                              {row.hostingStatus === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                              <Heart size={10} fill="currentColor" /> {row.bloodType || '?'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px] italic font-medium" title={row.restrictions}>
                              {row.restrictions || 'Sem restrições'}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a 
                          href={`https://wa.me/${String(row.phone || '').replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Falar no WhatsApp"
                          className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all inline-block shadow-sm"
                        >
                          <Phone size={16} />
                        </a>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-300">
                          {loading ? <RefreshCw size={48} className="animate-spin opacity-20" /> : <Search size={48} className="opacity-20" />}
                          <p className="font-bold text-sm">{loading ? 'Carregando registros...' : 'Nenhum registro encontrado'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, subValue }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-black text-slate-800">{value}</p>
        {subValue && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
