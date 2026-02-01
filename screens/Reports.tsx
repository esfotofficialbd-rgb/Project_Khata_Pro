
import React from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, TrendingUp, TrendingDown, FileBarChart, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Reports = () => {
  const { projects, transactions, attendance } = useData();
  const navigate = useNavigate();

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  
  // Expenses (Accrual Basis for Profitability)
  // Material Expense (from transactions type 'expense')
  const totalMaterialCost = transactions
     .filter(t => t.type === 'expense')
     .reduce((sum, t) => sum + t.amount, 0);
     
  // Labor Expense (from attendance)
  const totalLaborCost = attendance.reduce((sum, a) => sum + a.amount, 0);

  // Total Accrual Expense
  const totalExpense = totalMaterialCost + totalLaborCost;

  // Project wise cost
  const projectData = projects.map(p => {
     // Recalculate per project to be safe
     const pLabor = attendance.filter(a => a.project_id === p.id).reduce((sum, a) => sum + a.amount, 0);
     const pMat = transactions.filter(t => t.project_id === p.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
     return {
        name: p.project_name,
        expense: pLabor + pMat,
        budget: p.budget_amount
     };
  }).slice(0, 5);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // CSV Download Logic (Robust Blob Method)
  const downloadReport = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Project'];
    
    // Combine Transactions and Labor Cost into one report
    const txRows = transactions.map(t => [
      t.date,
      t.type === 'expense' ? 'Expense' : t.type === 'income' ? 'Income' : 'Salary Payment',
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.amount,
      `"${projects.find(p => p.id === t.project_id)?.project_name || 'General'}"`
    ]);

    // Format as CSV
    const csvContent = [
        headers.join(","),
        ...txRows.map(e => e.join(","))
    ].join("\n");
        
    // Create Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Trigger Download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ProjectKhata_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
               <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg text-gray-800">রিপোর্ট ও এনালাইটিক্স</h1>
         </div>
         <button 
            onClick={downloadReport}
            className="text-blue-600 bg-blue-50 p-2 rounded-full hover:bg-blue-100 active:scale-95 transition-transform"
            title="CSV ডাউনলোড করুন"
         >
            <Download size={20} />
         </button>
      </div>

      <div className="p-4 space-y-4">
         {/* Summary Cards */}
         <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-2 mb-2 text-green-600">
                  <TrendingUp size={18} />
                  <span className="text-xs font-bold">মোট আয়</span>
               </div>
               <p className="text-xl font-bold text-gray-800">৳ {totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-2 mb-2 text-red-600">
                  <TrendingDown size={18} />
                  <span className="text-xs font-bold">মোট ব্যয় (খরচ)</span>
               </div>
               <p className="text-xl font-bold text-gray-800">৳ {totalExpense.toLocaleString()}</p>
            </div>
         </div>

         {/* Cost Breakdown */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <PieChart size={18} className="text-blue-500" /> খরচের খাত
            </h3>
            
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-600">লেবার খরচ (হাজিরা)</span>
                     <span className="font-bold">৳ {totalLaborCost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                     <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(totalLaborCost / (totalExpense || 1)) * 100}%` }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-600">ম্যাটেরিয়াল / অন্যান্য</span>
                     <span className="font-bold">৳ {totalMaterialCost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                     <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(totalMaterialCost / (totalExpense || 1)) * 100}%` }}></div>
                  </div>
               </div>
            </div>
         </div>

         {/* Project Comparison Chart */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <FileBarChart size={18} className="text-purple-500" /> প্রজেক্ট খরচ
            </h3>
            <div className="h-64 w-full text-xs">
               <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={projectData} layout="vertical">
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={100} />
                     <Tooltip />
                     <Bar dataKey="expense" name="খরচ" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {projectData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={colors[index % 20]} />
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
