import React from 'react';
import { Droplet, Flame, Sparkles, Sun, CheckCircle, AlertCircle } from 'lucide-react';
import { SkinMetric } from '../../types';

interface SkinInsightsChartProps {
  metrics?: {
    hydration?: SkinMetric;
    oiliness?: SkinMetric;
    texture?: SkinMetric;
    evenness?: SkinMetric;
  } | SkinMetric[];
  overallScore?: number;
}

export const SkinInsightsChart: React.FC<SkinInsightsChartProps> = ({
  metrics,
  overallScore = 84
}) => {
  const getStatusBadge = (status: SkinMetric['status']) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('optimal')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
          <CheckCircle size={10} />
          Optimal
        </span>
      );
    }
    if (s.includes('moderate')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/40 text-[10px] font-bold">
          Moderate
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
        <AlertCircle size={10} />
        Needs Focus
      </span>
    );
  };

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'hydration':
        return <Droplet size={16} className="text-blue-600" />;
      case 'oiliness':
        return <Flame size={16} className="text-amber-600" />;
      case 'texture':
        return <Sparkles size={16} className="text-emerald-600" />;
      case 'evenness':
        return <Sun size={16} className="text-[#997A2E]" />;
      default:
        return <Sparkles size={16} className="text-[#D4AF37]" />;
    }
  };

  const defaultMetrics: Record<string, SkinMetric> = {
    hydration: { name: 'Cellular Hydration', score: 82, status: 'optimal', description: 'Deep stratum corneum moisture retention' },
    oiliness: { name: 'Lipid Barrier', score: 76, status: 'optimal', description: 'Balanced sebum barrier defense' },
    texture: { name: 'Surface Texture', score: 88, status: 'optimal', description: 'Smooth, refined pore uniformity' },
    evenness: { name: 'Melanin Radiance', score: 80, status: 'moderate', description: 'High luminosity with mild pigmentation protection' }
  };

  const getMetricData = (key: 'hydration' | 'oiliness' | 'texture' | 'evenness', index: number): SkinMetric => {
    if (Array.isArray(metrics)) {
      return metrics[index] || defaultMetrics[key];
    }
    if (metrics && typeof metrics === 'object') {
      return (metrics as Record<string, SkinMetric>)[key] || defaultMetrics[key];
    }
    return defaultMetrics[key];
  };

  const metricList = [
    { key: 'hydration', data: getMetricData('hydration', 0), fillClass: 'bg-blue-600' },
    { key: 'oiliness', data: getMetricData('oiliness', 1), fillClass: 'bg-amber-600' },
    { key: 'texture', data: getMetricData('texture', 2), fillClass: 'bg-emerald-600' },
    { key: 'evenness', data: getMetricData('evenness', 3), fillClass: 'bg-[#D4AF37]' }
  ];

  return (
    <div className="w-full space-y-4">
      {/* Overall Score Badge */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/35 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#997A2E] block">
            Overall Health Index
          </span>
          <h3 className="font-heading font-extrabold text-3xl text-[#0F0F10] mt-0.5">
            {overallScore}<span className="text-sm font-semibold text-[#6B7280]">/100</span>
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Cellular vitality meets clinical dermatological baseline
          </p>
        </div>
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[#E5E7EB]"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-[#D4AF37] transition-all duration-1000 ease-out"
              strokeDasharray={`${overallScore}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute font-heading font-extrabold text-xs text-[#0F0F10]">
            {overallScore}%
          </span>
        </div>
      </div>

      {/* 4 Diagnostic Parameter Bars */}
      <div className="space-y-3">
        {metricList.map(({ key, data, fillClass }) => (
          <div
            key={key}
            className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:border-[#D4AF37]/40 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB]">
                  {getMetricIcon(key)}
                </div>
                <span className="font-heading font-bold text-xs text-[#0F0F10]">
                  {data.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-[#0F0F10]">
                  {data.value ?? data.score ?? 0}%
                </span>
                {getStatusBadge(data.status)}
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden border border-[#E5E7EB] my-2">
              <div
                className={`h-full ${fillClass} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${data.value ?? data.score ?? 0}%` }}
              />
            </div>

            {/* Clinical Insight */}
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              {data.insight || data.description || ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
