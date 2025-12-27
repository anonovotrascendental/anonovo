
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
  ExternalLink
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
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    if (!GOOGLE_SCRIPT_URL) {
      alert("A URL do Google Script não está configurada.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error(error);
      alert("Erro ao sincronizar dados da planilha.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo<AdminStats>(() => {
    return {
      total: data.length,
      day31: data.filter(r => (r.selectedDays || '').includes('31')).length,
      day01: data.filter(r => (r.selectedDays || '').includes('01')).length,
      day02: data.filter(r => (r.selectedDays || '').includes('02')).length,
      restrictions: data.filter(r => (r.restrictions || '').length > 3).length
    };
  }, [data]);

  const filteredData = data.filter(r => 
    (r.civilName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.spiritualName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.rg || '').includes(searchTerm)
  );

  const chartData = [
    { name: '31/Dez', count: stats.day31, color: '#f59e0b' },
    { name: '01/Jan', count: stats.day01, color: '#3b82f6' },
    { name: '02/Jan', count: stats.day02, color: '#10b981' },
  ];

  const exportCSV = () => {
    const headers = ["Nome Civil", "Nome Espiritual", "RG", "WhatsApp", "Dias", "Restrições", "Tipo Sanguíneo"];
    const rows = data.map(r => [
      r.civilName, 
      r.spiritualName, 
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
            <Button variant="success" size="sm" onClick={exportCSV}>
              <Download size={16} className="mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Inscritos" 
            value={stats.total} 
            icon={<Users className="text-blue-600" />} 
            color="bg-blue-50"
          />
          <StatCard 
            title="Almoço 31/Dez" 
            value={stats.day31} 
            icon={<Calendar className="text-amber-600" />} 
            color="bg-amber-50"
          />
          <StatCard 
            title="Almoço 01/Jan" 
            value={stats.day01} 
            icon={<Calendar className="text-emerald-600" />} 
            color="bg-emerald-50"
          />
          <StatCard 
            title="Alertas Restrição" 
            value={stats.restrictions} 
            icon={<AlertTriangle className="text-red-600" />} 
            color="bg-red-50"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart View */}
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-8">Fluxo de Participantes</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-500">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-700">{item.count} pessoas</span>
                </div>
              ))}
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

            <div className="flex-1 overflow-x-auto">
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
                      <th className="px-6 py-4">Dias</th>
                      <th className="px-6 py-4">Observações</th>
                      <th className="px-6 py-4">Contato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{row.civilName}</div>
                          <div className="text-xs text-amber-600 font-medium">{row.spiritualName || 'Sem nome espiritual'}</div>
                          <div className="text-[10px] text-slate-400">RG: {row.rg}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
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
                            <span className="text-slate-300 text-xs">Nenhuma</span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">Sangue: {row.bloodType || '?'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <a 
                            href={`https://wa.me/${row.phone?.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all inline-block"
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
            
            <div className="p-4 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={12} /> Última sincronização em: {new Date().toLocaleTimeString()}
              </div>
              <div>Banco de Dados Transparente</div>
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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;
