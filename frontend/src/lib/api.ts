import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const api = {
    uploadDocs: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const response = await apiClient.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    queryDocs: async (question: string, sessionId: string = "default") => {
        const response = await apiClient.post("/query", {
            question,
            session_id: sessionId,
        });
        return response.data;
    },

    getHistory: async (sessionId: string = "default") => {
        const response = await apiClient.get(`/history/${sessionId}`);
        return response.data;
    },
};
