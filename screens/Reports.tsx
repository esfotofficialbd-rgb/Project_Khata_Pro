
import React from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, TrendingUp, TrendingDown, FileBarChart, Download, Wallet, Printer, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Reports = () => {
  const { projects, transactions, attendance, t } = useData();
  const navigate = useNavigate();

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  
  // Expenses (Accrual Basis for Profitability)
  const totalMaterialCost = transactions
     .filter(t => t.type === 'expense')
     .reduce((sum, t) => sum + t.amount, 0);
     
  const totalLaborCost = attendance.reduce((sum, a) => sum + a.amount, 0);
  const totalExpense = totalMaterialCost + totalLaborCost;

  // Project wise cost
  const projectData = projects.map(p => {
     const pLabor = attendance.filter(a => a.project_id === p.id).reduce((sum, a) => sum + a.amount, 0);
     const pMat = transactions.filter(t => t.project_id === p.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
     return {
        name: p.project_name,
        expense: pLabor + pMat,
        budget: p.budget_amount
     };
  }).slice(0, 5);

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];

  // Invoice Logic
  const completedProjects = projects.filter(p => p.status === 'completed').sort((a,b) => b.id.localeCompare(a.id));
  const lastCompletedProject = completedProjects[0];

  const generateInvoice = () => {
     if (!lastCompletedProject) return;
     
     const pLabor = attendance.filter(a => a.project_id === lastCompletedProject.id).reduce((sum, a) => sum + a.amount, 0);
     const pMat = transactions.filter(t => t.project_id === lastCompletedProject.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
     const total = pLabor + pMat;

     const printWindow = window.open('', '_blank');
     if (printWindow) {
        printWindow.document.write(`
           <!DOCTYPE html>
           <html>
             <head>
               <title>Invoice - ${lastCompletedProject.project_name}</title>
               <script src="https://cdn.tailwindcss.com"></script>
               <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
               <style>body { font-family: 'Hind Siliguri', sans-serif; }</style>
             </head>
             <body class="bg-gray-100 p-8">
                <div class="max-w-2xl mx-auto bg-white p-10 rounded-xl shadow-lg print:shadow-none">
                   <div class="flex justify-between items-start mb-8 border-b pb-6">
                      <div>
                         <h1 class="text-4xl font-bold text-slate-800">INVOICE</h1>
                         <p class="text-slate-500 font-mono mt-1">#${lastCompletedProject.id.slice(-6).toUpperCase()}</p>
                      </div>
                      <div class="text-right">
                         <h2 class="text-xl font-bold text-blue-600">Project Khata</h2>
                         <p class="text-sm text-slate-500">Construction Management</p>
                         <p class="text-sm text-slate-500 mt-1">${new Date().toLocaleDateString('bn-BD', {dateStyle:'long'})}</p>
                      </div>
                   </div>

                   <div class="mb-8">
                      <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Bill To</h3>
                      <h2 class="text-2xl font-bold text-slate-800">${lastCompletedProject.client_name || 'Client Name'}</h2>
                      <p class="text-slate-600 font-bold">${lastCompletedProject.project_name}</p>
                      <p class="text-slate-500 text-sm">${lastCompletedProject.location}</p>
                      ${lastCompletedProject.client_phone ? `<p class="text-slate-500 text-sm">Phone: ${lastCompletedProject.client_phone}</p>` : ''}
                   </div>

                   <table class="w-full mb-8">
                      <thead>
                         <tr class="bg-slate-50 text-slate-600 text-sm uppercase">
                            <th class="py-3 px-4 text-left rounded-l-lg">Description</th>
                            <th class="py-3 px-4 text-right rounded-r-lg">Amount</th>
                         </tr>
                      </thead>
                      <tbody class="text-slate-700">
                         <tr class="border-b border-slate-50">
                            <td class="py-4 px-4 font-bold">Labor Costs (Total Attendance)</td>
                            <td class="py-4 px-4 text-right">৳ ${pLabor.toLocaleString()}</td>
                         </tr>
                         <tr class="border-b border-slate-50">
                            <td class="py-4 px-4 font-bold">Material & Other Expenses</td>
                            <td class="py-4 px-4 text-right">৳ ${pMat.toLocaleString()}</td>
                         </tr>
                      </tbody>
                      <tfoot>
                         <tr class="text-xl font-bold text-slate-800">
                            <td class="pt-6 px-4 text-right">Total Due</td>
                            <td class="pt-6 px-4 text-right text-blue-600">৳ ${total.toLocaleString()}</td>
                         </tr>
                      </tfoot>
                   </table>

                   <div class="border-t pt-8 text-center">
                      <p class="text-slate-400 text-xs">Thank you for your business!</p>
                      <p class="text-slate-300 text-[10px] mt-2">Generated by Project Khata App</p>
                   </div>
                </div>
                <script>window.print();</script>
             </body>
           </html>
        `);
        printWindow.document.close();
     }
  };

  // CSV Download Logic
  const downloadReport = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Project'];
    const txRows = transactions.map(t => [
      t.date,
      t.type === 'expense' ? 'Expense' : t.type === 'income' ? 'Income' : 'Salary Payment',
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${projects.find(p => p.id === t.project_id)?.project_name || 'General'}"`
    ]);

    const csvContent = [headers.join(","), ...txRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ProjectKhata_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 font-sans">
       <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
               <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg text-slate-800 dark:text-white">{t('analytics_title')}</h1>
         </div>
         <button 
            onClick={downloadReport}
            className="text-white bg-blue-600 p-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            title="CSV ডাউনলোড করুন"
         >
            <Download size={20} />
         </button>
      </div>

      <div className="p-4 space-y-4">
         
         {/* Invoice Generator Card */}
         {lastCompletedProject && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1 mb-1">
                        <CheckCircle size={10} /> Completed Project
                    </p>
                    <h3 className="font-bold text-lg">{lastCompletedProject.project_name}</h3>
                    <p className="text-xs text-indigo-100">Invoice ready for generation</p>
                </div>
                <button 
                    onClick={generateInvoice}
                    className="relative z-10 bg-white text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-indigo-50 transition-colors flex items-center gap-2"
                >
                    <Printer size={16} /> Print
                </button>
            </div>
         )}

         {/* Summary Cards */}
         <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden group">
               <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                  <TrendingUp size={64} className="text-emerald-600"/>
               </div>
               <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                  <div className="bg-white dark:bg-emerald-900/50 p-1.5 rounded-lg shadow-sm">
                     <TrendingUp size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">{t('total_income_stat')}</span>
               </div>
               <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">৳ {totalIncome.toLocaleString()}</p>
            </div>
            
            <div className="bg-rose-50 dark:bg-rose-900/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 relative overflow-hidden group">
               <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                  <TrendingDown size={64} className="text-rose-600"/>
               </div>
               <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                  <div className="bg-white dark:bg-rose-900/50 p-1.5 rounded-lg shadow-sm">
                     <TrendingDown size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">{t('total_expense_stat')}</span>
               </div>
               <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">৳ {totalExpense.toLocaleString()}</p>
            </div>
         </div>

         {/* Cost Breakdown - Gradient Card */}
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
               <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                  <PieChart size={18} />
               </div> 
               {t('expense_breakdown')}
            </h3>
            
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between text-sm mb-2">
                     <span className="text-slate-500 dark:text-slate-400 font-bold">{t('labor_cost')}</span>
                     <span className="font-bold text-slate-800 dark:text-white">৳ {totalLaborCost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                     <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full shadow-sm" style={{ width: `${(totalLaborCost / (totalExpense || 1)) * 100}%` }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-2">
                     <span className="text-slate-500 dark:text-slate-400 font-bold">{t('material_other')}</span>
                     <span className="font-bold text-slate-800 dark:text-white">৳ {totalMaterialCost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                     <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-sm" style={{ width: `${(totalMaterialCost / (totalExpense || 1)) * 100}%` }}></div>
                  </div>
               </div>
            </div>
         </div>

         {/* Project Comparison Chart */}
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
               <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600">
                  <FileBarChart size={18} />
               </div>
               {t('project_cost')}
            </h3>
            
            {/* Fixed Height Container to prevent width(-1) error */}
            <div className="w-full h-64 text-xs font-bold">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectData} layout="vertical" barSize={20}>
                     <XAxis type="number" hide />
                     <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} 
                        axisLine={false}
                        tickLine={false}
                     />
                     <Tooltip 
                        contentStyle={{ 
                           borderRadius: '12px', 
                           border: 'none', 
                           boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                           backgroundColor: 'rgba(255, 255, 255, 0.95)',
                           fontSize: '12px',
                           fontWeight: 'bold',
                           color: '#1e293b'
                        }}
                        cursor={{fill: 'transparent'}}
                     />
                     <Bar dataKey="expense" name="খরচ" radius={[0, 10, 10, 0]}>
                        {projectData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};
