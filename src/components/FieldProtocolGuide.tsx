import React from 'react';
import { X, ShieldAlert, BookOpen, Activity, Droplets, Wind, Bug } from 'lucide-react';

interface FieldProtocolGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FieldProtocolGuide: React.FC<FieldProtocolGuideProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Public Health Outbreak Protocols
              </h2>
              <p className="text-xs text-slate-400">
                Official epidemiological response standards for the 3 live scenarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Protocols */}
        <div className="space-y-6">
          {/* Protocol 1: Cholera */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Droplets className="w-4 h-4" />
              <span>1. Cholera (Vibrio cholerae) — Waterborne Emergency</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>Mechanism:</strong> Cholera toxin causes severe cyclic-AMP-mediated chloride secretion into the intestinal lumen, leading to lethal isotonic volume depletion.
            </p>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
              <li><strong className="text-slate-200">Immediate Priority:</strong> Rapid Oral Rehydration Salts (ORS) solution; IV Ringer's Lactate for severe dehydration.</li>
              <li><strong className="text-slate-200">WASH:</strong> Water chlorination with free residual chlorine ≥0.5 mg/L, safe sanitation cots, and hygiene education.</li>
              <li><strong className="text-slate-200">Pitfall to Avoid:</strong> Mass prophylactic antibiotics are contraindicated by WHO.</li>
            </ul>
          </div>

          {/* Protocol 2: Measles */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Wind className="w-4 h-4" />
              <span>2. Measles (Morbillivirus) — Aerosol Airborne Transmission</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>Mechanism:</strong> Extremely high basic reproduction number (R₀ ≈ 12-18). Airborne droplet nuclei remain suspended and infectious in room air for up to 2 hours.
            </p>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
              <li><strong className="text-slate-200">Post-Exposure Prophylaxis (PEP):</strong> MMR vaccine within 72 hours of exposure; IG within 6 days for vulnerable contacts.</li>
              <li><strong className="text-slate-200">School Control:</strong> Airborne isolation of cases and exclusion of unimmunized students through day 21.</li>
              <li><strong className="text-slate-200">Pitfall to Avoid:</strong> Surface bleaching desks does not prevent airborne inhalation.</li>
            </ul>
          </div>

          {/* Protocol 3: Malaria */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Bug className="w-4 h-4" />
              <span>3. Malaria (Plasmodium falciparum) — Vector-Borne Surge</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>Mechanism:</strong> Biting female Anopheles mosquitoes transmit sporozoites. In high-transmission seasons, severe falciparum can cause rapid cerebral malaria and severe anemia.
            </p>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
              <li><strong className="text-slate-200">Case Management:</strong> Parasitological test (RDT or microscopy) followed by prompt Artemisinin-based Combination Therapy (ACT).</li>
              <li><strong className="text-slate-200">Vector Control:</strong> Long-Lasting Insecticidal Nets (LLINs) and eliminating larval breeding puddles.</li>
              <li><strong className="text-slate-200">Pitfall to Avoid:</strong> Blind chloroquine prophylaxis without testing fails due to widespread parasite resistance.</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
