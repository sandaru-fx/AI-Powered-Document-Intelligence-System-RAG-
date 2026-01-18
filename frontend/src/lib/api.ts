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
    }
};
