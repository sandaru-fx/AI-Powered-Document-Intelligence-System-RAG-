import axios from "axios";
import { supabase } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const instance = axios.create({
    baseURL: API_BASE_URL,
});

instance.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export const api = {
    uploadDocs: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const response = await instance.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    queryDocs: async (question: string, sessionId?: string) => {
        const response = await instance.post("/query", {
            question,
            session_id: sessionId,
        });
        return response.data;
    },

    streamQueryDocs: async (question: string, sessionId: string, onChunk: (chunk: any) => void) => {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${API_BASE_URL}/query/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token || ""}`
            },
            body: JSON.stringify({ question, session_id: sessionId })
        });

        if (!response.ok) throw new Error("Stream request failed");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            onChunk(data);
                        } catch (e) {
                            console.error("Error parsing stream chunk", e);
                        }
                    }
                }
            }
        }
    },

    getHistory: async (sessionId: string) => {
        const response = await instance.get(`/history/${sessionId}`);
        return response.data;
    },

    compareDocs: async (filenames: string[], aspect: string = "general") => {
        const response = await instance.post("/compare", { filenames, aspect });
        return response.data;
    },

    exportReport: async (sessionId: string) => {
        const response = await instance.get(`/export/${sessionId}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    getDocuments: async () => {
        const response = await instance.get("/documents");
        return response.data;
    },

    getSessions: async () => {
        const response = await instance.get("/sessions");
        return response.data;
    },

    updateSessionTitle: async (sessionId: string, title: string) => {
        const response = await instance.patch(`/sessions/${sessionId}`, { title });
        return response.data;
    },

    deleteSession: async (sessionId: string) => {
        const response = await instance.delete(`/sessions/${sessionId}`);
        return response.data;
    }
};
