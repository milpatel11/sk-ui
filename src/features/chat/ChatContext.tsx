"use client";
import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {apiClient} from '@/lib/apiClient';
import {ChatMessage, ChatThread, GlobalUser} from '@/lib/types';

interface ChatContextValue {
    threads: ChatThread[];
    activeThreadId: string | null;
    setActiveThreadId: (id: string | null) => void;
    messages: ChatMessage[];
    loadingThreads: boolean;
    loadingMessages: boolean;
    sendMessage: (threadId: string, body: string, sender: string) => Promise<void>;
    startDirect: (userId: string, currentUserId: string) => Promise<string>;
    users: GlobalUser[];
    starting: boolean;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode; currentUserId: string }> = ({
                                                                                                 children,
                                                                                                 currentUserId
                                                                                             }) => {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [users, setUsers] = useState<GlobalUser[]>([]);
    const [starting, setStarting] = useState(false);

    const loadThreads = useCallback(async () => {
        setLoadingThreads(true);
        try {
            const resp = await apiClient.get('/chat/threads');
            setThreads(resp.data || []);
        } finally {
            setLoadingThreads(false);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const resp = await apiClient.get('/users');
            setUsers(resp.data || []);
        } catch {
        }
    }, []);

    const loadMessages = useCallback(async (threadId: string) => {
        setLoadingMessages(true);
        try {
            const resp = await apiClient.get(`/chat/messages/${threadId}`);
            setMessages(resp.data || []);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        loadThreads();
        loadUsers();
    }, [loadThreads, loadUsers]);
    useEffect(() => {
        if (activeThreadId) loadMessages(activeThreadId);
    }, [activeThreadId, loadMessages]);

    const sendMessage = async (threadId: string, body: string, sender: string) => {
        if (!body.trim()) return;
        await apiClient.post('/chat/messages', {thread_id: threadId, body, sender_user_id: sender});
        await loadThreads();
        await loadMessages(threadId);
    };

    const startDirect = async (userId: string, currentUserId: string) => {
        setStarting(true);
        try {
            // reuse existing direct thread if present
            const existing = threads.find(t => t.type === 'DIRECT' && t.participant_user_ids.includes(userId) && t.participant_user_ids.includes(currentUserId));
            if (existing) {
                setActiveThreadId(existing.thread_id);
                return existing.thread_id;
            }
            const resp = await apiClient.post('/chat/threads', {
                participant_user_ids: [currentUserId, userId],
                type: 'DIRECT'
            });
            const threadId = resp.data.thread_id;
            await loadThreads();
            setActiveThreadId(threadId);
            return threadId;
        } finally {
            setStarting(false);
        }
    };

    return (
        <ChatContext.Provider value={{
            threads,
            activeThreadId,
            setActiveThreadId,
            messages,
            loadingThreads,
            loadingMessages,
            sendMessage,
            startDirect,
            users,
            starting
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within ChatProvider');
    return ctx;
};
