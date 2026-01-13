import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Upload, FileText, Send, Loader2, MessageSquare, 
  ChevronRight, ChevronDown, File as FileIcon, X,
  Activity, ShieldCheck, Microscope, ScrollText, CheckCircle,
  Stethoscope, Building2, Scale, Palette, Settings, Globe, Moon, Sun, Dna
} from 'lucide-react';

// --- Constants & Config ---

const I18N = {
  en: {
    appTitle: "FDA 510(k) Smart Analyzer",
    model: "Model",
    analyzeTitle: "Analyze 510(k) Summary",
    analyzeSubtitle: "Upload a PDF/JSON file or paste text to generate an interactive regulatory summary.",
    tabUpload: "File Upload",
    tabPaste: "Paste Text",
    dropText: "Drag & drop or click to upload",
    dropSubtext: "Supports PDF, TXT, MD, JSON",
    removeFile: "Remove",
    placeholderPaste: "Paste 510(k) summary text here...",
    btnAnalyze: "Generate Summary",
    btnAnalyzing: "Analyzing Document...",
    btnAnalyzeAnother: "Analyze another document",
    chatTitle: "Consultant Chat",
    chatPlaceholder: "Ask about this 510(k)...",
    thinking: "Thinking...",
    execSummary: "Executive Summary",
    submitterInfo: "Submitter Information",
    deviceInfo: "Device Information",
    predicateDevice: "Predicate Device",
    deviceDetails: "Device Details",
    perfData: "Performance Data",
    labels: {
      submitterName: "Submitter Name",
      contactPerson: "Contact Person",
      datePrepared: "Date Prepared",
      tradeName: "Trade Name",
      commonName: "Common Name",
      className: "Classification Name",
      regClass: "Regulatory Class",
      prodCode: "Product Code",
      reviewPanel: "Review Panel",
      primaryPred: "Primary Predicate",
      kNumber: "510(k) Number",
      manufacturer: "Manufacturer",
      compSummary: "Comparison Summary",
      devDesc: "Device Description",
      indUse: "Indications for Use",
      techChar: "Technological Characteristics",
      nonClin: "Non-Clinical Testing",
      clin: "Clinical Testing",
      concl: "Conclusion"
    },
    settings: {
      title: "Settings",
      apiKey: "Google GenAI API Key",
      apiKeyDesc: "Enter your API key to use the application.",
      save: "Save API Key",
      saved: "Saved!",
      style: "Artistic Style",
      jackpot: "Jackpot!",
      theme: "Theme",
      lang: "Language"
    }
  },
  'zh-TW': {
    appTitle: "FDA 510(k) 智慧分析儀",
    model: "模型",
    analyzeTitle: "分析 510(k) 摘要",
    analyzeSubtitle: "上傳 PDF/JSON 檔案或貼上文字以生成互動式法規摘要。",
    tabUpload: "檔案上傳",
    tabPaste: "貼上文字",
    dropText: "拖放或點擊上傳",
    dropSubtext: "支援 PDF, TXT, MD, JSON",
    removeFile: "移除",
    placeholderPaste: "在此貼上 510(k) 摘要文字...",
    btnAnalyze: "生成摘要",
    btnAnalyzing: "正在分析文件...",
    btnAnalyzeAnother: "分析另一份文件",
    chatTitle: "顧問諮詢",
    chatPlaceholder: "詢問關於此 510(k) 的問題...",
    thinking: "思考中...",
    execSummary: "執行摘要",
    submitterInfo: "提交者資訊",
    deviceInfo: "裝置資訊",
    predicateDevice: "對照裝置 (Predicate)",
    deviceDetails: "裝置詳情",
    perfData: "性能數據",
    labels: {
      submitterName: "提交者名稱",
      contactPerson: "聯絡人",
      datePrepared: "準備日期",
      tradeName: "商品名稱",
      commonName: "通用名稱",
      className: "分類名稱",
      regClass: "法規等級",
      prodCode: "產品代碼",
      reviewPanel: "審查小組",
      primaryPred: "主要對照裝置",
      kNumber: "510(k) 編號",
      manufacturer: "製造商",
      compSummary: "比較摘要",
      devDesc: "裝置描述",
      indUse: "適應症",
      techChar: "技術特性",
      nonClin: "非臨床測試",
      clin: "臨床測試",
      concl: "結論"
    },
    settings: {
      title: "設定",
      apiKey: "Google GenAI API Key",
      apiKeyDesc: "輸入您的 API 金鑰以使用應用程式。",
      save: "儲存金鑰",
      saved: "已儲存！",
      style: "藝術風格",
      jackpot: "手氣不錯！",
      theme: "主題",
      lang: "語言"
    }
  }
};

const PAINTER_STYLES = [
  { name: "Default", label: "Standard / 標準", colors: { brand: "#0f766e", contrast: "#ffffff" } },
  { name: "VanGogh", label: "Van Gogh / 梵谷", colors: { brand: "#1d4e89", contrast: "#fbd13c" } },
  { name: "Monet", label: "Monet / 莫內", colors: { brand: "#748b97", contrast: "#e6e6fa" } },
  { name: "DaVinci", label: "Da Vinci / 達文西", colors: { brand: "#5d4037", contrast: "#f5deb3" } },
  { name: "Picasso", label: "Picasso / 畢卡索", colors: { brand: "#e07a5f", contrast: "#3d405b" } },
  { name: "Dali", label: "Dali / 達利", colors: { brand: "#d35400", contrast: "#87ceeb" } },
  { name: "Rembrandt", label: "Rembrandt / 林布蘭", colors: { brand: "#3e2723", contrast: "#ffd700" } },
  { name: "Warhol", label: "Warhol / 沃荷", colors: { brand: "#ff1493", contrast: "#00ffff" } },
  { name: "Matisse", label: "Matisse / 馬諦斯", colors: { brand: "#d32f2f", contrast: "#ffffff" } },
  { name: "Pollock", label: "Pollock / 波洛克", colors: { brand: "#212121", contrast: "#fafafa" } },
  { name: "Klimt", label: "Klimt / 克林姆", colors: { brand: "#b8860b", contrast: "#2f4f4f" } },
  { name: "Munch", label: "Munch / 孟克", colors: { brand: "#ff4500", contrast: "#1a1a2e" } },
  { name: "OKeeffe", label: "O'Keeffe / 歐姬芙", colors: { brand: "#f06292", contrast: "#fff0f5" } },
  { name: "Kahlo", label: "Kahlo / 卡蘿", colors: { brand: "#006400", contrast: "#ff6347" } },
  { name: "Basquiat", label: "Basquiat / 巴斯奇亞", colors: { brand: "#000000", contrast: "#ffff00" } },
  { name: "Hokusai", label: "Hokusai / 北齋", colors: { brand: "#006994", contrast: "#f0f8ff" } },
  { name: "Renoir", label: "Renoir / 雷諾瓦", colors: { brand: "#ff7f50", contrast: "#f5f5dc" } },
  { name: "Cezanne", label: "Cezanne / 塞尚", colors: { brand: "#556b2f", contrast: "#faebd7" } },
  { name: "Hopper", label: "Hopper / 霍珀", colors: { brand: "#2e8b57", contrast: "#f5f5dc" } },
  { name: "Mondrian", label: "Mondrian / 蒙德里安", colors: { brand: "#d50000", contrast: "#ffffff" } },
  { name: "Rothko", label: "Rothko / 羅斯科", colors: { brand: "#800000", contrast: "#ff7f50" } },
];

// --- Types & Schema ---

const AnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    submitter: {
      type: Type.OBJECT,
      properties: { name: { type: Type.STRING }, contactName: { type: Type.STRING }, datePrepared: { type: Type.STRING } }
    },
    device: {
      type: Type.OBJECT,
      properties: {
        tradeName: { type: Type.STRING }, commonName: { type: Type.STRING }, classificationName: { type: Type.STRING },
        regulatoryClass: { type: Type.STRING }, productCode: { type: Type.STRING }, panel: { type: Type.STRING }
      }
    },
    predicate: {
      type: Type.OBJECT,
      properties: { primaryPredicate: { type: Type.STRING }, kNumber: { type: Type.STRING }, manufacturer: { type: Type.STRING }, comparisonSummary: { type: Type.STRING } }
    },
    details: {
      type: Type.OBJECT,
      properties: { deviceDescription: { type: Type.STRING }, indicationsForUse: { type: Type.STRING }, technologicalCharacteristics: { type: Type.STRING } }
    },
    performance: {
      type: Type.OBJECT,
      properties: { nonClinical: { type: Type.STRING }, clinical: { type: Type.STRING }, conclusion: { type: Type.STRING } }
    }
  },
  required: ["executiveSummary", "submitter", "device", "predicate", "details", "performance"]
};

type AnalysisResult = {
  executiveSummary: string;
  submitter: { name: string; contactName: string; datePrepared: string };
  device: { tradeName: string; commonName: string; classificationName: string; regulatoryClass: string; productCode: string; panel: string };
  predicate: { primaryPredicate: string; kNumber: string; manufacturer: string; comparisonSummary: string };
  details: { deviceDescription: string; indicationsForUse: string; technologicalCharacteristics: string };
  performance: { nonClinical: string; clinical: string; conclusion: string };
};

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

// --- Components ---

const SectionCard = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children?: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg bg-card shadow-sm mb-4 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-bg/50 hover:bg-bg transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/10 text-brand rounded-md">
            <Icon size={20} />
          </div>
          <h3 className="font-semibold text-text">{title}</h3>
        </div>
        {isOpen ? <ChevronDown size={20} className="text-text-muted" /> : <ChevronRight size={20} className="text-text-muted" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-border text-text-muted text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string, value: string | undefined }) => (
  <div className="mb-2 last:mb-0">
    <span className="text-text-muted text-xs uppercase font-bold tracking-wider block mb-1">{label}</span>
    <span className="text-text font-medium">{value || 'N/A'}</span>
  </div>
);

// --- Main App ---

const App = () => {
  // Config State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'zh-TW'>('en');
  const [painterStyle, setPainterStyle] = useState(PAINTER_STYLES[0]);
  const [apiKey, setApiKey] = useState(() => {
    return (typeof process !== 'undefined' && process.env?.API_KEY) || localStorage.getItem('gemini_api_key') || '';
  });
  const [showSettings, setShowSettings] = useState(!apiKey);

  // App State
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // Refs
  const chatSessionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const t = I18N[lang];

  // Effects
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Apply Theme & Style
  useEffect(() => {
    const root = document.documentElement;
    
    // Theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Painter Style Colors
    if (painterStyle.name !== 'Default') {
      // Override CSS variables for brand colors
      root.style.setProperty('--color-brand', painterStyle.colors.brand);
      root.style.setProperty('--color-brand-contrast', painterStyle.colors.contrast);
    } else {
      root.style.removeProperty('--color-brand');
      root.style.removeProperty('--color-brand-contrast');
    }

  }, [theme, painterStyle]);

  const handleJackpot = () => {
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * PAINTER_STYLES.length);
      setPainterStyle(PAINTER_STYLES[randomIdx]);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
      }
    }, 100);
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    if (key) setShowSettings(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if ((inputMode === 'upload' && !file) || (inputMode === 'paste' && !textInput)) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setChatHistory([]);
    chatSessionRef.current = null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      let contents: any[] = [];
      if (inputMode === 'upload' && file) {
        const base64Data = await readFileAsBase64(file);
        contents = [{ inlineData: { mimeType: file.type, data: base64Data } }];
      } else {
        contents = [{ text: textInput }];
      }

      // Step 1: Structured Analysis
      const analysisModel = ai.models; 
      const analysisResponse = await analysisModel.generateContent({
        model: selectedModel,
        contents: [
          ...contents, 
          { text: `Extract key FDA 510(k) summary info into the JSON structure. Language: ${lang === 'en' ? 'English' : 'Traditional Chinese'}.` }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: AnalysisSchema,
        }
      });

      const jsonText = analysisResponse.text;
      if (jsonText) {
        const result = JSON.parse(jsonText) as AnalysisResult;
        setAnalysis(result);

        // Step 2: Chat
        const chat = ai.chats.create({
          model: selectedModel,
          config: {
            systemInstruction: `You are an expert FDA Regulatory Affairs Specialist. Language: ${lang === 'en' ? 'English' : 'Traditional Chinese'}. Answer strictly based on the provided 510(k) document.`,
          },
          history: [
            {
              role: 'user',
              parts: inputMode === 'upload' && file 
                ? [{ inlineData: { mimeType: file.type, data: await readFileAsBase64(file) } }, { text: "Analyze this document." }]
                : [{ text: `Document text:\n${textInput}` }]
            },
            {
              role: 'model',
              parts: [{ text: "Analysis complete. I am ready to answer questions." }]
            }
          ]
        });
        chatSessionRef.current = chat;
        setChatHistory([{ role: 'model', text: lang === 'en' ? "Ready to answer questions about this device." : "已準備好回答關於此裝置的問題。" }]);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please check your API key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !chatSessionRef.current) return;
    const userMsg = currentMessage;
    setCurrentMessage('');
    setIsChatting(true);
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      setChatHistory(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Error generating response." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // --- Render ---

  if (showSettings && !analysis && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-md p-8 rounded-xl shadow-xl border border-border">
          <div className="flex items-center gap-2 mb-6 text-brand">
            <Settings size={32} />
            <h1 className="text-2xl font-bold">{t.settings.title}</h1>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">{t.settings.apiKey}</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full p-3 rounded-lg border border-border bg-bg focus:ring-2 focus:ring-brand outline-none"
              />
              <p className="text-xs text-text-muted mt-1">{t.settings.apiKeyDesc}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.settings.lang}</label>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setLang('en')} className={`flex-1 p-2 text-sm ${lang === 'en' ? 'bg-brand text-brand-contrast' : 'hover:bg-bg'}`}>EN</button>
                  <button onClick={() => setLang('zh-TW')} className={`flex-1 p-2 text-sm ${lang === 'zh-TW' ? 'bg-brand text-brand-contrast' : 'hover:bg-bg'}`}>中</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.settings.theme}</label>
                 <div className="flex border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setTheme('light')} className={`flex-1 p-2 flex justify-center ${theme === 'light' ? 'bg-brand text-brand-contrast' : 'hover:bg-bg'}`}><Sun size={18}/></button>
                  <button onClick={() => setTheme('dark')} className={`flex-1 p-2 flex justify-center ${theme === 'dark' ? 'bg-brand text-brand-contrast' : 'hover:bg-bg'}`}><Moon size={18}/></button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.settings.style}</label>
              <div className="flex gap-2">
                <select 
                  value={painterStyle.name}
                  onChange={(e) => setPainterStyle(PAINTER_STYLES.find(s => s.name === e.target.value) || PAINTER_STYLES[0])}
                  className="flex-1 p-2 rounded-lg border border-border bg-bg text-sm"
                >
                  {PAINTER_STYLES.map(s => <option key={s.name} value={s.name}>{s.label}</option>)}
                </select>
                <button 
                  onClick={handleJackpot}
                  className="bg-brand text-brand-contrast px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Palette size={16} /> {t.settings.jackpot}
                </button>
              </div>
            </div>

            <button 
              onClick={() => saveApiKey(apiKey)}
              disabled={!apiKey}
              className="w-full bg-brand text-brand-contrast py-3 rounded-lg font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
            >
              {apiKey ? t.analyzeTitle : t.settings.save}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-brand text-brand-contrast shadow-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="text-brand-contrast/80" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">{t.appTitle}</h1>
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
             {/* Controls */}
             <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
               <button onClick={() => setLang(lang === 'en' ? 'zh-TW' : 'en')} className="p-1.5 hover:bg-white/10 rounded" title={t.settings.lang}>
                 <Globe size={18} />
               </button>
               <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-1.5 hover:bg-white/10 rounded" title={t.settings.theme}>
                 {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
               </button>
               <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-white/10 rounded" title={t.settings.title}>
                 <Settings size={18} />
               </button>
             </div>

             <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1 px-3 text-sm">
                <span className="text-brand-contrast/70 hidden sm:inline">{t.model}:</span>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent border-none text-brand-contrast font-medium focus:ring-0 cursor-pointer outline-none"
                  disabled={isAnalyzing}
                >
                  <option value="gemini-2.5-flash" className="text-black">Gemini 2.5 Flash</option>
                  <option value="gemini-3-pro-preview" className="text-black">Gemini 3.0 Pro</option>
                </select>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!analysis ? (
          /* Input View */
          <div className="max-w-2xl mx-auto mt-8 sm:mt-12">
            <div className="bg-card rounded-xl shadow-lg p-6 sm:p-8 border border-border">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text mb-2">{t.analyzeTitle}</h2>
                <p className="text-text-muted">{t.analyzeSubtitle}</p>
              </div>

              <div className="flex border-b border-border mb-6">
                <button 
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${inputMode === 'upload' ? 'text-brand border-b-2 border-brand' : 'text-text-muted hover:text-text'}`}
                >
                  {t.tabUpload}
                </button>
                <button 
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${inputMode === 'paste' ? 'text-brand border-b-2 border-brand' : 'text-text-muted hover:text-text'}`}
                >
                  {t.tabPaste}
                </button>
              </div>

              <div className="min-h-[200px] flex flex-col justify-center">
                {inputMode === 'upload' ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-bg transition-colors relative">
                    <input 
                      type="file" 
                      accept=".pdf,.txt,.md,.json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {file ? (
                      <div className="flex flex-col items-center text-brand">
                        <FileIcon size={48} className="mb-2" />
                        <span className="font-medium text-lg">{file.name}</span>
                        <span className="text-sm text-text-muted">{(file.size / 1024).toFixed(0)} KB</span>
                        <button 
                          onClick={(e) => { e.preventDefault(); setFile(null); }}
                          className="mt-4 text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 z-10 relative border border-red-200"
                        >
                          {t.removeFile}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-text-muted">
                        <Upload size={48} className="mb-2" />
                        <span className="font-medium">{t.dropText}</span>
                        <span className="text-xs mt-1">{t.dropSubtext}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t.placeholderPaste}
                    className="w-full h-64 p-4 border border-border rounded-lg bg-bg focus:ring-2 focus:ring-brand focus:border-brand text-sm resize-none"
                  />
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (inputMode === 'upload' && !file) || (inputMode === 'paste' && !textInput)}
                className="w-full mt-6 bg-brand text-brand-contrast py-3 rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {t.btnAnalyzing}
                  </>
                ) : (
                  <>
                    <Activity size={20} />
                    {t.btnAnalyze}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Analysis Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-8rem)]">
            <div className="lg:col-span-2 overflow-y-auto pr-2 custom-scrollbar">
               <div className="bg-card p-6 rounded-xl shadow-sm border border-border mb-6">
                 <div className="flex items-start gap-4 mb-4">
                   <div className="p-3 bg-brand/10 text-brand rounded-lg">
                     <ScrollText size={24} />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-text">{t.execSummary}</h2>
                     <p className="text-text-muted leading-relaxed mt-2">{analysis.executiveSummary}</p>
                   </div>
                 </div>
               </div>

               <SectionCard title={t.submitterInfo} icon={Building2} defaultOpen={true}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Field label={t.labels.submitterName} value={analysis.submitter.name} />
                   <Field label={t.labels.contactPerson} value={analysis.submitter.contactName} />
                   <Field label={t.labels.datePrepared} value={analysis.submitter.datePrepared} />
                 </div>
               </SectionCard>

               <SectionCard title={t.deviceInfo} icon={Microscope} defaultOpen={true}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Field label={t.labels.tradeName} value={analysis.device.tradeName} />
                   <Field label={t.labels.commonName} value={analysis.device.commonName} />
                   <Field label={t.labels.className} value={analysis.device.classificationName} />
                   <Field label={t.labels.regClass} value={analysis.device.regulatoryClass} />
                   <Field label={t.labels.prodCode} value={analysis.device.productCode} />
                   <Field label={t.labels.reviewPanel} value={analysis.device.panel} />
                 </div>
               </SectionCard>

               <SectionCard title={t.predicateDevice} icon={Scale}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <Field label={t.labels.primaryPred} value={analysis.predicate.primaryPredicate} />
                   <Field label={t.labels.kNumber} value={analysis.predicate.kNumber} />
                   <Field label={t.labels.manufacturer} value={analysis.predicate.manufacturer} />
                 </div>
                 <div className="bg-bg p-3 rounded text-sm text-text-muted border border-border">
                   <span className="font-semibold block mb-1 text-text">{t.labels.compSummary}:</span>
                   {analysis.predicate.comparisonSummary}
                 </div>
               </SectionCard>

               <SectionCard title={t.deviceDetails} icon={Stethoscope}>
                 <div className="space-y-4">
                   <div>
                     <span className="font-bold text-text block mb-1">{t.labels.devDesc}</span>
                     <p>{analysis.details.deviceDescription}</p>
                   </div>
                   <div>
                     <span className="font-bold text-text block mb-1">{t.labels.indUse}</span>
                     <p>{analysis.details.indicationsForUse}</p>
                   </div>
                   <div>
                     <span className="font-bold text-text block mb-1">{t.labels.techChar}</span>
                     <p>{analysis.details.technologicalCharacteristics}</p>
                   </div>
                 </div>
               </SectionCard>

               <SectionCard title={t.perfData} icon={ShieldCheck}>
                 <div className="space-y-4">
                   <div>
                     <span className="font-bold text-text block mb-1">{t.labels.nonClin}</span>
                     <p>{analysis.performance.nonClinical}</p>
                   </div>
                   {analysis.performance.clinical && (
                     <div>
                       <span className="font-bold text-text block mb-1">{t.labels.clin}</span>
                       <p>{analysis.performance.clinical}</p>
                     </div>
                   )}
                   <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                     <span className="font-bold text-green-800 dark:text-green-400 flex items-center gap-2 mb-1">
                       <CheckCircle size={16} /> {t.labels.concl}
                     </span>
                     <p className="text-green-900 dark:text-green-200">{analysis.performance.conclusion}</p>
                   </div>
                 </div>
               </SectionCard>
               
               <button 
                 onClick={() => setAnalysis(null)}
                 className="mt-8 text-text-muted hover:text-brand flex items-center gap-2 text-sm font-medium transition-colors"
               >
                 <Upload size={16} /> {t.btnAnalyzeAnother}
               </button>
            </div>

            {/* Right: Chat */}
            <div className="lg:col-span-1 bg-card rounded-xl shadow-lg border border-border flex flex-col overflow-hidden h-[500px] lg:h-full mt-6 lg:mt-0">
              <div className="p-4 bg-bg border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-text font-semibold">
                  <MessageSquare size={18} />
                  <h3>{t.chatTitle}</h3>
                </div>
                <span className="text-xs px-2 py-1 bg-brand/10 text-brand rounded-full font-medium">
                  {selectedModel}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand text-brand-contrast rounded-br-none' 
                        : 'bg-bg text-text rounded-bl-none border border-border'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-bg rounded-lg p-3 rounded-bl-none border border-border flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-text-muted" />
                      <span className="text-xs text-text-muted">{t.thinking}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border bg-card">
                <div className="flex items-center gap-2 bg-bg border border-border rounded-lg p-2 focus-within:ring-2 focus-within:ring-brand focus-within:border-brand transition-all">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.chatPlaceholder}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none text-text placeholder-text-muted"
                    disabled={isChatting}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isChatting}
                    className="p-2 bg-brand text-brand-contrast rounded-md hover:brightness-110 disabled:opacity-50 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Root element not found");
}