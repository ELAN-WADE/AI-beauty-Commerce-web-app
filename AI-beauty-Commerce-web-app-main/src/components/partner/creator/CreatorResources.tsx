import React from 'react';
import { Download, FileText, Image, Video, Sparkles, BookOpen } from 'lucide-react';

export const CreatorResources: React.FC = () => {
  const resources = [
    {
      id: 'res-1',
      title: 'Desla!™ Brand Editorial Guidelines 2026',
      type: 'PDF Document (4.2 MB)',
      desc: 'Official visual typography, medical claim guardrails, approved tone of voice, and logo safety rules.',
      icon: BookOpen
    },
    {
      id: 'res-2',
      title: 'High-Res Clinical Product Packaging Asset Pack',
      type: 'ZIP Bundle (85 MB)',
      desc: 'Isolated PNG cutouts on transparent backgrounds, clinical ingredient cards, and texture swatches.',
      icon: Image
    },
    {
      id: 'res-3',
      title: 'Instagram Reels & TikTok Video Hook Presets',
      type: 'CapCut / Premiere Presets (12 MB)',
      desc: 'Pacing templates, text overlays, and beauty routine title cards optimized for 9:16 mobile feeds.',
      icon: Video
    },
    {
      id: 'res-4',
      title: 'Clinical Formulation Science Dossier',
      type: 'PDF Document (6.8 MB)',
      desc: 'Dermatologist-backed breakdown of PDRN, Niacinamide, Azelaic Acid, and Melanin-safe SPF50+ filters.',
      icon: FileText
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Media Kits &amp; Brand Assets
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Creator Resources
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Download high-resolution product photography, video editing templates, and clinical claims fact sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res) => {
          const Icon = res.icon;
          return (
            <div
              key={res.id}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#6B7280]">
                    {res.type}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F0F10]">{res.title}</h3>
                <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">{res.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E5E7EB]">
                <button
                  onClick={() => alert(`Downloading: ${res.title}`)}
                  className="w-full py-2.5 rounded-full bg-[#FAF9F6] hover:bg-[#0F0F10] hover:text-white text-xs font-semibold text-[#0F0F10] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Resource</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
