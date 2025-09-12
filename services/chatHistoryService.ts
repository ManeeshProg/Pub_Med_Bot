export interface ChatSession {
  id: string;
  title: string;
  mode: 'Concept' | 'Literature Review' | 'Citation' | 'Exam Notes';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  mode?: string;
  timestamp: string;
}

const CHAT_HISTORY_KEY = 'chatbot_history';

export const chatHistoryService = {
  // Get all chat sessions
  getAllSessions: (): ChatSession[] => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  },

  // Get a specific session by ID
  getSession: (id: string): ChatSession | null => {
    const sessions = chatHistoryService.getAllSessions();
    return sessions.find(session => session.id === id) || null;
  },

  // Save a new session
  saveSession: (session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>): ChatSession => {
    const sessions = chatHistoryService.getAllSessions();
    const newSession: ChatSession = {
      ...session,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedSessions = [newSession, ...sessions];
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedSessions));
    return newSession;
  },

  // Update an existing session
  updateSession: (id: string, updates: Partial<ChatSession>): ChatSession | null => {
    const sessions = chatHistoryService.getAllSessions();
    const sessionIndex = sessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) return null;
    
    const updatedSession = {
      ...sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    sessions[sessionIndex] = updatedSession;
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions));
    return updatedSession;
  },

  // Add a message to a session
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'timestamp'>): ChatSession | null => {
    const session = chatHistoryService.getSession(sessionId);
    if (!session) return null;
    
    const newMessage: ChatMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };
    
    const updatedSession = {
      ...session,
      messages: [...session.messages, newMessage],
      updatedAt: new Date().toISOString()
    };
    
    return chatHistoryService.updateSession(sessionId, updatedSession);
  },

  // Delete a session
  deleteSession: (id: string): boolean => {
    const sessions = chatHistoryService.getAllSessions();
    const filteredSessions = sessions.filter(session => session.id !== id);
    
    if (filteredSessions.length === sessions.length) return false;
    
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filteredSessions));
    return true;
  },

  // Clear all sessions
  clearAllSessions: (): void => {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  },

  // Generate a title from the first user message
  generateTitle: (firstMessage: string): string => {
    const words = firstMessage.trim().split(' ');
    if (words.length <= 6) return firstMessage;
    return words.slice(0, 6).join(' ') + '...';
  }
};
