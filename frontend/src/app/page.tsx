"use client";

import { Pencil, Check, X, Sparkles, Download } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { ChatInterface, ChatInterfaceHandle } from "@/components/ChatInterface";
import { DocumentUploader } from "@/components/DocumentUploader";
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from "react";

const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
});
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import { cn, generateUUID } from "@/lib/utils"; // Assuming cn utility is available

export default function Dashboard() {
  const { user, loading } = useAuth();

  const chatRef = useRef<ChatInterfaceHandle>(null);
  const [sessionId, setSessionId] = useState("");

  // Elite Features State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<{ url: string, page?: number }>({ url: "" });
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Header State
  const [projectName, setProjectName] = useState("New Research Project");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const startEditing = () => {
    setTempName(projectName);
    setIsEditingName(true);
  };

  const saveName = () => {
    if (tempName.trim()) setProjectName(tempName);
    setIsEditingName(false);
  };


  useEffect(() => {
    setSessionId(generateUUID());
  }, []);

  const handleSendMessage = async (question: string) => {
    if (!chatRef.current) return;

    chatRef.current.setLoading(true);

    try {
      if (isComparisonMode && selectedDocs.length > 0) {
        const response = await api.compareDocs(selectedDocs, question);
        chatRef.current.addMessage({
          role: "assistant",
          content: response.analysis,
          sources: response.sources,
        });
      } else {
        const response = await api.queryDocs(question, sessionId);
        chatRef.current.addMessage({
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        });
      }
    } catch (error: any) {
      chatRef.current.addMessage({
        role: "assistant",
        content: `Error: ${error.response?.data?.detail || "Failed to get response from AI."}`,
      });
    } finally {
      chatRef.current.setLoading(false);
    }
  };

  const handleSourceClick = (filename: string, page?: number) => {
    // In a real app, this URL would be a signed URL or a direct link to the backend storage
    // For local development, we'll assume the backend serves it or we use a placeholder
    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL}/files/${filename}`;
    setViewerConfig({ url: pdfUrl, page });
    setViewerOpen(true);
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportReport(sessionId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Research_Report_${sessionId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  return (
    <main className="flex h-screen bg-background overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-card-border bg-card-bg/80 backdrop-blur-xl flex items-center justify-between px-6 z-10 sticky top-0 transition-colors duration-300">

          {/* Left: Project Identity */}
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shadow-sm">
                <span className="text-white font-bold">R</span>
              </span>
              <span className="hidden md:inline">Research <span className="text-indigo-600 dark:text-indigo-400">Lab</span></span>
            </h1>

            <div className="h-8 w-[1px] bg-card-border" />

            {/* Editable Project Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-background border border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none min-w-[200px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <button onClick={saveName} className="p-1.5 hover:bg-green-500/10 rounded-lg text-green-500 transition-colors"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsEditingName(false)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div
                className="group flex items-center gap-3 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all border border-transparent hover:border-card-border"
                onClick={startEditing}
              >
                <div>
                  <span className="block text-sm font-medium text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{projectName}</span>
                  <span className="block text-[10px] text-muted-foreground font-mono leading-none mt-0.5">ID: {sessionId.slice(0, 8)}</span>
                </div>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            )}
          </div>

          {/* Right: Action Toolbar */}
          <div className="flex items-center gap-3 bg-background p-1.5 rounded-xl border border-card-border shadow-sm">

            <button
              onClick={() => setIsComparisonMode(!isComparisonMode)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                isComparisonMode
                  ? "brand-gradient text-white shadow-md shadow-indigo-500/25"
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className={cn("w-4 h-4", isComparisonMode ? "text-white animate-pulse" : "text-indigo-500")} />
              {isComparisonMode ? "Expert Mode" : "Compare"}
            </button>

            <div className="h-6 w-[1px] bg-card-border mx-1" />

            <button
              onClick={handleExport}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors relative group"
              title="Export Report"
            >
              <Download className="w-5 h-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-foreground text-background px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Export PDF</span>
            </button>

            <DocumentUploader onUploadComplete={(filenames: string[]) => {
              setSelectedDocs(prev => Array.from(new Set([...prev, ...filenames])));
            }} />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">

          {/* Left Pane: Chat Interface */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
            viewerOpen ? "mr-0 w-1/2" : "w-full"
          )}>
            <div className="flex-1 overflow-hidden relative px-4 pb-4">
              <ChatInterface
                ref={chatRef}
                onSendMessage={handleSendMessage}
                onSourceClick={handleSourceClick}
                activeDocument={selectedDocs[selectedDocs.length - 1]}
              />
            </div>
          </div>

          {/* Right Pane: PDF Viewer (Split View) */}
          <div className={cn(
            "border-l border-white/5 bg-[#0a0a0c] transition-all duration-300 ease-in-out flex flex-col",
            viewerOpen ? "w-1/2 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-full absolute right-0 h-full overflow-hidden"
          )}>
            {viewerOpen && (
              <PDFViewer
                url={viewerConfig.url}
                initialPage={viewerConfig.page}
                onClose={() => setViewerOpen(false)}
                isInline={true}
              />
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
