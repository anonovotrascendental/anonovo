
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
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { RegistrationRecord, AdminStats } from '../types';
import { GOOGLE_SCRIPT_URL, ORGANIZER_PHONE } from '../constants';
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
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) {
        throw new Error(`Servidor respondeu com status ${response.status}`);
      }
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Não foi possível carregar os dados. Verifique a conexão ou as permissões do script.");
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
      day30: data.filter(r => (r.selectedDays || '').includes('30/Dez')).length,
      day31: data.filter(r => (r.selectedDays || '').includes('31/Dez')).length,
      day01: data.filter(r => (r.selectedDays || '').includes('01/Jan')).length,
      day02: data.filter(r => (r.selectedDays || '').includes('02/Jan')).length,
      day03: data.filter(r => (r.selectedDays || '').includes('03/Jan')).length,
      hosting: data.filter(r => r.participationType === 'hosting').length,
      hostingPaid: data.filter(r => r.participationType === 'hosting' && r.hostingStatus === 'paid').length,
      hostingPending: data.filter(r => r.participationType === 'hosting' && r.hostingStatus === 'reserving').length,
      restrictions: data.filter(r => (r.restrictions || '').length > 3).length
    };
  }, [data]);

  const filteredData = data.filter(r => 
    (r.civilName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.spiritualName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.rg || '').includes(searchTerm)
  );

  const chartData = [
    { name: '30/Dez', count: stats.day30, color: '#f59e0b' },
    { name: '31/Dez', count: stats.day31, color: '#f97316' },
    { name: '01/Jan', count: stats.day01, color: '#3b82f6' },
    { name: '02/Jan', count: stats.day02, color: '#10b981' },
    { name: '03/Jan', count: stats.day03, color: '#06b6d4' },
    { name: 'Hosped.', count: stats.hosting, color: '#8b5cf6' },
  ];

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = ["Data Inscrição", "Nome Civil", "Nome Espiritual", "Tipo", "Reserva", "RG", "WhatsApp", "Dias", "Restrições", "Tipo Sanguíneo"];
    const rows = data.map(r => [
      r.timestamp || '',
      r.civilName, 
      r.spiritualName, 
      r.participationType === 'hosting' ? 'Hospedagem' : 'Day Use',
      r.hostingStatus === 'paid' ? 'Pago' : r.hostingStatus === 'reserving' ? 'Pendente' : 'N/A',
      r.rg, 
      r.phone, 
      r.selectedDays, 
      r.restrictions, 
      r.bloodType
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(field => `"${field}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inscricoes_ano_novo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Dashboard */}
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
                <Database className="text-amber-600" /> Painel de Controle
              </h1>
              <p className="text-sm text-slate-400">Gestão de inscritos e logística de Prasadam</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} isLoading={loading}>
              <RefreshCw size={16} className="mr-2" /> Sincronizar
            </Button>
            <Button variant="success" size="sm" onClick={exportCSV} disabled={data.length === 0}>
              <Download size={16} className="mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Inscritos" 
            value={stats.total} 
            icon={<Users className="text-blue-600" />} 
            color="bg-blue-50"
          />
          <StatCard 
            title="Total Hospedagem" 
            value={stats.hosting} 
            icon={<Home className="text-purple-600" />} 
            color="bg-purple-50"
          />
          <StatCard 
            title="Hospedagem Paga" 
            value={stats.hostingPaid} 
            icon={<CheckCircle2 className="text-emerald-600" />} 
            color="bg-emerald-50"
            subValue={`${stats.hostingPending} pendentes`}
          />
          <StatCard 
            title="Alergias/Restr" 
            value={stats.restrictions} 
            icon={<AlertTriangle className="text-red-600" />} 
            color="bg-red-50"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart View */}
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-8">Participação por Dia</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={30}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table View */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, documento..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400 font-medium whitespace-nowrap">
                <Filter size={16} /> {filteredData.length} resultados
              </div>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <RefreshCw className="animate-spin mr-2" /> Carregando base de dados...
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Database size={48} className="mb-2 opacity-20" />
                  Nenhum registro encontrado.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Inscrito</th>
                      <th className="px-6 py-4">Participação</th>
                      <th className="px-6 py-4">Reserva/Status</th>
                      <th className="px-6 py-4">Dias</th>
                      <th className="px-6 py-4">Observações</th>
                      <th className="px-6 py-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{row.civilName}</div>
                          <div className="text-xs text-amber-600 font-medium">{row.spiritualName || 'Sem nome espiritual'}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-tighter">RG: {row.rg}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${row.participationType === 'hosting' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {row.participationType === 'hosting' ? 'Hospedagem' : 'Day Use'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {row.participationType === 'hosting' ? (
                            <span className={`flex items-center gap-1.5 text-xs font-bold ${row.hostingStatus === 'paid' ? 'text-emerald-600' : 'text-orange-500'}`}>
                              {row.hostingStatus === 'paid' ? (
                                <><CheckCircle2 size={14} /> Pago</>
                              ) : (
                                <><Clock size={14} /> Pendente</>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {(row.selectedDays || '').split(',').map(d => (
                              <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                                {d.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {row.restrictions ? (
                            <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                              <AlertTriangle size={12} /> {row.restrictions}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs italic">Nenhuma</span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">Sanguíneo: {row.bloodType || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <a 
                            href={`https://wa.me/${row.phone?.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all inline-block shadow-sm"
                            title="Conversar no WhatsApp"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subValue }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-black text-slate-800">{value}</p>
        {subValue && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform pointer-events-none"></div>
  </div>
);

export default AdminDashboard;
