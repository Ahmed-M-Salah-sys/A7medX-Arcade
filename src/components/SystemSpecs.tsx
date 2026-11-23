import { SystemSpecs as SystemSpecsType } from '@/types/game';
import { Cpu, HardDrive, Monitor, Layers, ShieldCheck, Download, Archive } from 'lucide-react';

interface SystemSpecsProps {
  minimum: SystemSpecsType;
  recommended: SystemSpecsType;
  downloadSize?: string;
}

export function SystemSpecs({ minimum, recommended, downloadSize }: SystemSpecsProps) {
  const specsList = [
    { label: 'Operating System', icon: Monitor, min: minimum?.os || 'Windows 10 64-bit', rec: recommended?.os || 'Windows 11 64-bit' },
    { label: 'Processor (CPU)', icon: Cpu, min: minimum?.processor || 'Intel Core i3 / AMD Ryzen 3', rec: recommended?.processor || 'Intel Core i5 / AMD Ryzen 5' },
    { label: 'Memory (RAM)', icon: Layers, min: minimum?.memory || '4 GB RAM', rec: recommended?.memory || '16 GB RAM' },
    { label: 'Graphics (GPU)', icon: Monitor, min: minimum?.graphics || 'DirectX 11 compatible', rec: recommended?.graphics || 'NVIDIA GTX 1660 / AMD RX 5600' },
    { label: 'Required Storage', icon: HardDrive, min: minimum?.storage || '2 GB available space', rec: recommended?.storage || '4 GB SSD space' },
  ];

  if (downloadSize) {
    specsList.push({
      label: 'Archive Package (.zip)',
      icon: Archive,
      min: downloadSize,
      rec: downloadSize,
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
            <span>System Requirements</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare hardware specifications and package storage footprint
          </p>
        </div>

        {downloadSize && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20 text-xs font-mono font-semibold">
            <Archive className="w-3.5 h-3.5" />
            <span>Package Size: {downloadSize}</span>
          </div>
        )}
      </div>

      {/* Desktop / Tablet View: Full Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <th className="py-3.5 px-6 font-semibold text-slate-500 dark:text-slate-400">Component</th>
              <th className="py-3.5 px-6 font-semibold text-purple-600 dark:text-purple-400">
                Minimum Requirements
              </th>
              <th className="py-3.5 px-6 font-semibold text-cyan-600 dark:text-cyan-400">
                Recommended Specifications
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {specsList.map((item, index) => {
              const Icon = item.icon;
              const isArchiveRow = item.label.includes('Archive');
              return (
                <tr
                  key={index}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isArchiveRow ? 'bg-purple-500/5 dark:bg-cyan-500/5 font-semibold' : ''
                    }`}
                >
                  <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isArchiveRow ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className={isArchiveRow ? 'text-purple-600 dark:text-cyan-400' : ''}>{item.label}</span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {item.min}
                  </td>
                  <td className="py-3.5 px-6 text-slate-800 dark:text-slate-200 font-semibold font-mono text-xs">
                    {item.rec}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Stacked Cards (Zero horizontal scroll on phones) */}
      <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
        {specsList.map((item, index) => {
          const Icon = item.icon;
          const isArchiveRow = item.label.includes('Archive');
          return (
            <div
              key={index}
              className={`p-4 space-y-2.5 ${isArchiveRow ? 'bg-purple-500/5 dark:bg-cyan-500/5' : ''
                }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200">
                <Icon className={`w-4 h-4 shrink-0 ${isArchiveRow ? 'text-cyan-400' : 'text-purple-500 dark:text-cyan-400'}`} />
                <span className={isArchiveRow ? 'text-purple-600 dark:text-cyan-400 font-bold' : ''}>
                  {item.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-0.5">
                    Minimum
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 break-words">
                    {item.min}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-0.5">
                    Recommended
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium break-words">
                    {item.rec}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
