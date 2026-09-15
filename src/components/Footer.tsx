import React from 'react';
import { Heart, ShieldCheck, MapPin } from 'lucide-react';
import { STONE_OPERATIONS } from '../types';
import { YellowRibbon } from './YellowRibbon';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print border-t border-emerald-200/80 bg-[#F4F7F4] text-emerald-900/80 text-xs py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-emerald-200/60">
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-['Outfit',sans-serif] font-bold text-[#08301D] text-sm">
                Correio Verde
              </span>
              <YellowRibbon className="w-7 h-3.5 sm:w-8 sm:h-4" />
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-700 font-semibold">Stone SCL</span>
            </div>
            <p className="text-emerald-800/90 font-medium italic">
              "Ninguém joga em alto nível sozinho(a)."
            </p>
          </div>

          <div className="flex items-center gap-2 text-emerald-800 bg-white border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#00A868]" />
            <span>Garantia de sigilo absoluto do remetente</span>
          </div>
        </div>

        {/* Stone SCL Operations */}
        <div className="pt-6 text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>Polos e Operações SCL Representados</span>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {STONE_OPERATIONS.map((op) => (
              <span
                key={op}
                className="px-2.5 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] text-emerald-900 shadow-xs"
              >
                {op}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-700/70 gap-2">
          <p>© 2026 Stone SCL — Iniciativa de Reconhecimento e Engajamento Interno</p>
          <p className="flex items-center gap-1">
            Feito para espalhar gratidão no Sertão, Cerrado e Litoral <Heart className="w-3 h-3 text-[#00A868] fill-[#00A868]" />
          </p>
        </div>
      </div>
    </footer>
  );
};
