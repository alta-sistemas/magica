import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { Controls } from './components/Controls';
import { processImage } from './utils/processor';
import { analyzeImage } from './services/geminiService';
import { ProcessingSettings, HalftoneShape } from './types';
import { ImagePlus, Info, ZoomIn, ZoomOut, Maximize, Hand, Grab, LogOut, Shield, Loader2 } from 'lucide-react';

const DEFAULT_SETTINGS: ProcessingSettings = {
  blackThreshold: 30,
  gridSize: 6,
  shape: HalftoneShape.CIRCLE,
  colorMode: 'original',
  monoColor: '#ffffff',
  intensity: 1.0,
  invert: false,
};

// Internal component for the actual app content to use `useAuth` hook safely
const AppContent: React.FC = () => {
  const { user, loading: authLoading, logout, deductCredit } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Zoom and Pan State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Zoom / Pan Logic ---

  const handleWheel = (e: React.WheelEvent) => {
    if (!image) return;
    const scaleFactor = 1.1;
    const delta = -e.deltaY;
    setTransform(prev => {
      const newScale = delta > 0 ? prev.scale * scaleFactor : prev.scale / scaleFactor;
      const clampedScale = Math.min(Math.max(newScale, 0.1), 10);
      return { ...prev, scale: clampedScale };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    if (e.button === 0) {
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
    }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const fitToScreen = useCallback(() => {
    if (!image || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 60;
    const availableWidth = clientWidth - padding;
    const availableHeight = clientHeight - padding;
    const scaleX = availableWidth / image.width;
    const scaleY = availableHeight / image.height;
    const scale = Math.min(scaleX, scaleY, 1);
    setTransform({
        x: 0,
        y: 0,
        scale: scale
    });
  }, [image]);

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 10) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }));

  // --- File & AI Handling ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageUrl(url);
        setAiSuggestion(null);
      };
      img.src = url;
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    setIsAnalyzing(true);
    setAiSuggestion(null);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await analyzeImage(base64);
        setSettings(prev => ({
          ...prev,
          shape: result.suggestedShape,
          gridSize: result.suggestedGridSize
        }));
        setAiSuggestion(result.reasoning);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      setIsAnalyzing(false);
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    
    // Auth Check (Async)
    const success = await deductCredit();
    if (!success) {
      alert("Você não tem créditos suficientes para exportar. Entre em contato com o administrador.");
      setIsExporting(false);
      return;
    }

    const link = document.createElement('a');
    link.download = 'dtf-halftone-export.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    setIsExporting(false);
  };

  const runProcessing = useCallback(() => {
    if (!image || !canvasRef.current) return;
    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      requestAnimationFrame(() => {
        processImage(ctx, image, settings, image.width, image.height);
        setIsProcessing(false);
      });
    }
  }, [image, settings]);

  // --- Effects ---

  useEffect(() => {
    if (image) fitToScreen();
  }, [image, fitToScreen]);

  useEffect(() => {
    runProcessing();
  }, [runProcessing]);

  // --- Auth Logic ---
  
  if (authLoading) {
    return (
        <div className="h-screen w-screen bg-gray-950 flex items-center justify-center text-emerald-500">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // --- Main Render ---

  return (
    <>
        <div className="flex flex-col lg:flex-row-reverse h-screen bg-gray-950 overflow-hidden font-sans">
        
        {/* Main Workspace */}
        <div className="flex-1 flex flex-col relative h-full min-w-0 order-1 lg:order-2">
            
            {/* Top Bar with User Info */}
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-lg">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.role === 'admin' ? 'bg-purple-600' : 'bg-gray-700'}`}>
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                     </div>
                     <span className="text-xs text-gray-300 font-medium hidden sm:block">{user.name}</span>
                </div>
                
                {user.role === 'admin' && (
                    <button 
                        onClick={() => setShowAdminPanel(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full shadow-lg transition-colors"
                        title="Painel Admin"
                    >
                        <Shield className="w-4 h-4" />
                    </button>
                )}

                <button 
                    onClick={logout}
                    className="bg-gray-800 hover:bg-red-900/50 hover:text-red-200 text-gray-400 p-2 rounded-full shadow-lg transition-colors border border-gray-700"
                    title="Sair"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>


            {/* AI Notification */}
            {aiSuggestion && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-emerald-900/90 backdrop-blur border-b border-emerald-500/30 p-3 text-emerald-100 text-sm flex items-start gap-3 animate-slideDown shadow-xl mt-14 lg:mt-0">
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                    <p className="flex-1"><strong>Recomendação da IA:</strong> {aiSuggestion}</p>
                    <button 
                        onClick={() => setAiSuggestion(null)} 
                        className="p-1 hover:bg-emerald-800 rounded transition-colors"
                    >
                        &times;
                    </button>
                </div>
            )}

            <div 
            ref={containerRef}
            className={`flex-1 overflow-hidden relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-gray-900 cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            >
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{
                    backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`
                }} 
            />

            {!image ? (
                <div className="text-center p-12 border-2 border-dashed border-gray-700 rounded-3xl bg-gray-800/50 hover:bg-gray-800/80 transition-all cursor-pointer group relative z-20 mx-4">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-5 text-gray-400 group-hover:text-white transition-colors">
                    <div className="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all shadow-xl">
                        <ImagePlus className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Carregar Arte</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Arraste e solte ou clique para navegar.<br/>
                            Suporta PNG e JPG. Recomenda-se alta resolução.
                        </p>
                    </div>
                </div>
                </div>
            ) : (
                <div 
                    className="relative shadow-2xl shadow-black ring-1 ring-white/10"
                    style={{ 
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        transformOrigin: 'center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                <canvas
                    ref={canvasRef}
                    width={image.width}
                    height={image.height}
                    className="block bg-transparent"
                />
                {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                </div>
            )}
            
            {image && (
                <div className="absolute top-4 right-4 flex gap-2 z-30">
                    <label className="bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-lg border border-gray-700 cursor-pointer hover:bg-gray-700 hover:border-gray-500 transition-all flex items-center gap-2">
                        <ImagePlus className="w-3.5 h-3.5" />
                        Trocar Imagem
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            {image && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/90 backdrop-blur border border-gray-700 p-1.5 rounded-xl shadow-2xl z-30">
                    <button onClick={zoomOut} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors" title="Diminuir Zoom"><ZoomOut className="w-5 h-5" /></button>
                    <div className="w-px h-4 bg-gray-700 mx-1"></div>
                    <span className="text-xs font-mono text-gray-400 w-12 text-center select-none">{Math.round(transform.scale * 100)}%</span>
                    <div className="w-px h-4 bg-gray-700 mx-1"></div>
                    <button onClick={zoomIn} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors" title="Aumentar Zoom"><ZoomIn className="w-5 h-5" /></button>
                    <button onClick={fitToScreen} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors ml-1" title="Ajustar à Tela"><Maximize className="w-5 h-5" /></button>
                </div>
            )}

            {image && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-gray-400 text-[10px] px-2 py-1 rounded border border-white/10 font-mono select-none pointer-events-none">
                    {image.width} x {image.height}px
                </div>
            )}
            </div>
        </div>

        {/* Sidebar */}
        <div className="order-2 lg:order-1">
            <Controls 
                settings={settings}
                updateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                onExport={handleExport}
            />
        </div>
        </div>

        {/* Admin Panel Modal */}
        {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
  );
};

export default App;
