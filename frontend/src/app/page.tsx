"use client";

import { Sidebar } from "@/components/Sidebar";
import { ChatInterface, ChatInterfaceHandle } from "@/components/ChatInterface";
import { DocumentUploader } from "@/components/DocumentUploader";
import { useState, useRef } from "react";
import { api } from "@/lib/api";

export default function Home() {
  const [isPending, setIsPending] = useState(false);
  const chatRef = useRef<ChatInterfaceHandle>(null);

  const handleSendMessage = async (question: string) => {
    setIsPending(true);
    try {
      const response = await api.queryDocs(question);
      chatRef.current?.addResponse(response.answer, response.sources);
    } catch (err) {
      console.error(err);
      chatRef.current?.addResponse("Error: Could not reach the intelligence engine. Make sure the backend is running.");
    } finally {
      setIsPending(false);
    }
  };

  const handleUploadComplete = () => {
    // Refresh history or show status if needed
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-brand-500/30">
      {/* Sidebar - Left */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-row p-6 gap-6 h-screen overflow-hidden">
        {/* Chat Section - Middle */}
        <div className="flex-[2] h-full">
          <ChatInterface
            ref={chatRef}
            onSendMessage={handleSendMessage}
            isPending={isPending}
          />
        </div>

        {/* Tools Section - Right */}
        <div className="flex-1 h-full flex flex-col gap-6">
          <DocumentUploader onUploadComplete={handleUploadComplete} />

          {/* Stats/Status Card */}
          <div className="glass-morphism rounded-3xl p-8 border border-white/10 flex-1">
            <h3 className="font-bold text-white mb-4">Engine Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Multimodal Agent</span>
                <span className="text-emerald-400 font-medium">Operational</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Hybrid Search</span>
                <span className="text-emerald-400 font-medium">Enabled (40/60)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Latency</span>
                <span className="text-zinc-400 font-medium">~1.2s</span>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 text-xs text-zinc-500 leading-relaxed">
                The system is using **EnsembleRetriever** with Gemini 1.5 Flash. Large PDFs are processed in batches of 50 chunks for optimal performance.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
