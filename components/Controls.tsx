import React from 'react';
import { HalftoneShape, ProcessingSettings } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Settings2, Wand2, Download, RefreshCw, Coins } from 'lucide-react';

interface ControlsProps {
  settings: ProcessingSettings;
  updateSettings: (partial: Partial<ProcessingSettings>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onExport: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  settings,
  updateSettings,
  onAnalyze,
  isAnalyzing,
  onExport
}) => {
  const { user } = useAuth();

  return (
    <div className="w-full lg:w-[450px] shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full overflow-y-auto z-40 shadow-xl scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent relative">
      <div className="p-6 border-b border-gray-800 bg-gray-900 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-emerald-500 text-2xl">❖</span> Halftone Magic
        </h1>
        <p className="text-gray-500 text-xs mt-1">Remoção de Fundo e Meio-tom</p>
        
        {/* Credit Display */}
        <div className="mt-4 flex items-center justify-between bg-gray-950 border border-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-500">
                <Coins className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Créditos</span>
            </div>
            <span className="text-lg font-mono font-bold text-white">
                {user?.role === 'admin' ? '∞' : user?.credits}
            </span>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-8">
        
        {/* AI Section */}
        <div className="space-y-3 bg-gray-800/30 p-4 rounded-xl border border-gray-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Wand2 className="w-3 h-3" /> Assistente IA
          </label>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>Sugerir Configurações</span>
            )}
          </button>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Usa o Gemini 3 Flash para analisar a densidade da imagem e sugerir os parâmetros ideais de meio-tom.
          </p>
        </div>

        <hr className="border-gray-800" />

        {/* Black Removal */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-gray-300">Remoção de Preto (Limiar)</label>
             <span className="text-xs text-emerald-300 font-mono bg-emerald-900/30 px-2 py-1 rounded border border-emerald-500/30">{settings.blackThreshold}</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            value={settings.blackThreshold}
            onChange={(e) => updateSettings({ blackThreshold: Number(e.target.value) })}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <p className="text-xs text-gray-500">
            Remove pixels de fundo mais escuros que este valor. <br/>Defina como <strong>0</strong> para manter todo o preto.
          </p>
        </div>

        {/* Halftone Settings */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Meio-tom (Vazado)
              </label>
              <span className="text-[10px] uppercase text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded">Furos</span>
           </div>
          
          {/* Shape */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Formato do Furo</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(HalftoneShape).map((shape) => (
                <button
                  key={shape}
                  onClick={() => updateSettings({ shape })}
                  className={`px-3 py-3 text-xs font-medium rounded-lg border transition-all ${
                    settings.shape === shape
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-900/20'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-600'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Size */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
               <span className="text-gray-300">Tamanho da Grade</span>
               <span className="text-xs text-emerald-300 font-mono bg-emerald-900/30 px-2 py-1 rounded border border-emerald-500/30">{settings.gridSize}px</span>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={settings.gridSize}
              onChange={(e) => updateSettings({ gridSize: Number(e.target.value) })}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wide font-medium">
               <span>Malha Fina</span>
               <span>Grossa</span>
            </div>
          </div>

          {/* Intensity */}
           <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
               <span className="text-gray-300">Tamanho do Furo (Intensidade)</span>
               <span className="text-xs text-emerald-300 font-mono bg-emerald-900/30 px-2 py-1 rounded border border-emerald-500/30">{settings.intensity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={settings.intensity}
              onChange={(e) => updateSettings({ intensity: Number(e.target.value) })}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wide font-medium">
               <span>Sólido (Furos Peq.)</span>
               <span>Aberto (Furos Gdes.)</span>
            </div>
          </div>

          {/* Invert */}
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                    <input 
                        type="checkbox" 
                        id="invert"
                        checked={settings.invert}
                        onChange={(e) => updateSettings({ invert: e.target.checked })}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-700 transition-all checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400"
                    />
                     <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="10"
                        height="10"
                        >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <label htmlFor="invert" className="text-sm text-gray-200 cursor-pointer font-medium select-none">
                    Inverter Lógica
                </label>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight pl-7">
                <strong>Marcado:</strong> Áreas brancas têm furos maiores (Negativo).<br/>
                <strong>Desmarcado:</strong> Áreas pretas têm furos maiores (Fade).
            </p>
          </div>


           {/* Color Mode */}
           <div className="space-y-3 border-t border-gray-800 pt-6">
            <label className="text-sm font-medium text-gray-300">Saída de Cor</label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => updateSettings({ colorMode: 'original' })}
                    className={`p-2 text-xs rounded-md border flex items-center justify-center gap-2 ${
                        settings.colorMode === 'original'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                >
                    <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-red-500"></div>
                    Original
                </button>
                <button
                    onClick={() => updateSettings({ colorMode: 'mono' })}
                    className={`p-2 text-xs rounded-md border flex items-center justify-center gap-2 ${
                        settings.colorMode === 'mono'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                >
                    <div className="w-3 h-3 rounded-full bg-white border border-gray-500"></div>
                    Monocromático
                </button>
            </div>
          </div>

          {settings.colorMode === 'mono' && (
             <div className="space-y-2 animate-fadeIn">
                <label className="text-sm text-gray-300">Cor da Tinta</label>
                <div className="flex gap-2 items-center">
                    <div className="relative w-full h-10 rounded-lg overflow-hidden ring-1 ring-gray-700">
                        <input 
                            type="color" 
                            value={settings.monoColor}
                            onChange={(e) => updateSettings({ monoColor: e.target.value })}
                            className="absolute -top-2 -left-2 w-[120%] h-[120%] cursor-pointer p-0 border-0"
                        />
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-2 rounded uppercase border border-gray-700">
                        {settings.monoColor}
                    </span>
                </div>
             </div>
          )}
        </div>

      </div>

      <div className="p-6 border-t border-gray-800 bg-gray-900 sticky bottom-0 z-20">
        <button 
            onClick={onExport}
            className="w-full py-3.5 bg-white text-gray-900 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 active:scale-95"
        >
            <Download className="w-5 h-5" />
            Exportar PNG {user?.role !== 'admin' && '(-1 Crédito)'}
        </button>
      </div>
    </div>
  );
};
