"use client";

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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils"; // Assuming cn utility is available

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const chatRef = useRef<ChatInterfaceHandle>(null);
  const [sessionId, setSessionId] = useState("default-" + Date.now());

  // Elite Features State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<{ url: string, page?: number }>({ url: "" });
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen w-full bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleSendMessage = async (question: string) => {
    if (!chatRef.current) return;

    chatRef.current.addMessage({ role: "user", content: question });
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
    <main className="flex h-screen bg-[#0a0a0c] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Research <span className="text-indigo-500">Laboratory</span>
            </h1>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-xs text-zinc-500 font-mono">ID: {sessionId.slice(0, 8)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsComparisonMode(!isComparisonMode)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2",
                isComparisonMode
                  ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-300"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", isComparisonMode ? "bg-indigo-500 animate-pulse" : "bg-zinc-600")} />
              {isComparisonMode ? "Comparison Mode Active" : "Expert Comparison"}
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-sm hover:bg-white/10 hover:text-white transition-all"
            >
              Export Report
            </button>
            <DocumentUploader onUploadComplete={(filenames: string[]) => {
              setSelectedDocs(prev => Array.from(new Set([...prev, ...filenames])));
            }} />
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <ChatInterface
            ref={chatRef}
            onSendMessage={handleSendMessage}
            onSourceClick={handleSourceClick}
          />
        </div>
      </div>

      {viewerOpen && (
        <PDFViewer
          url={viewerConfig.url}
          initialPage={viewerConfig.page}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </main>
  );
}
