"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";

interface EmiCalculatorProps {
  propertyPrice: number;
}

export function EmiCalculator({ propertyPrice }: EmiCalculatorProps) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(7.5);
  const [tenureYears, setTenureYears] = useState(20);

  const downPayment = (propertyPrice * downPaymentPct) / 100;
  const loanAmount = propertyPrice - downPayment;

  const emi = useMemo(() => {
    if (loanAmount <= 0 || interestRate <= 0 || tenureYears <= 0) return 0;
    const r = interestRate / 12 / 100; // monthly interest rate
    const n = tenureYears * 12; // number of months
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [loanAmount, interestRate, tenureYears]);

  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm md:p-8">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">EMI Calculator</h2>
          <p className="text-sm text-slate-600">Estimate your monthly payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          {/* Down Payment Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-slate-700">Down Payment ({downPaymentPct}%)</label>
              <span className="text-lg font-bold text-slate-900">${Math.round(downPayment).toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={downPaymentPct} 
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-slate-700">Interest Rate (%)</label>
              <span className="text-lg font-bold text-slate-900">{interestRate}%</span>
            </div>
            <input 
              type="range" 
              min="1" max="15" step="0.1"
              value={interestRate} 
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Tenure */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-slate-700">Loan Tenure (Years)</label>
              <span className="text-lg font-bold text-slate-900">{tenureYears} Years</span>
            </div>
            <input 
              type="range" 
              min="5" max="30" step="5"
              value={tenureYears} 
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-center border border-slate-100">
          <p className="mb-2 text-center font-medium text-slate-600">Estimated Monthly EMI</p>
          <div className="mb-6 text-center text-5xl font-extrabold text-slate-950 md:text-6xl">
            ${Math.round(emi).toLocaleString()}
          </div>
          
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Principal Amount</span>
              <span className="font-semibold text-slate-900">${Math.round(loanAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Interest Payable</span>
              <span className="border-b border-dashed border-slate-300 pb-1 font-semibold text-slate-900">${Math.round((emi * tenureYears * 12) - loanAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="font-medium text-slate-600">Total Payment (Principal + Interest)</span>
              <span className="font-bold text-slate-900">${Math.round(emi * tenureYears * 12).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
