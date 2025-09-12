import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CHATBOT_API_BASE } from '../constants';
import { chatHistoryService, ChatSession, ChatMessage } from '../services/chatHistoryService';
import ChatHistory from './ChatHistory';

interface Message {
  role: 'user' | 'bot';
  content: string;
  mode?: string;
}

interface ChatbotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
  mode?: string;
}

const ChatbotSidebar: React.FC<ChatbotSidebarProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'Concept' | 'Literature Review' | 'Citation' | 'Exam Notes'>('Concept');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    const userMessage: Message = { role: 'user', content: userInput, mode };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    // Create new session if this is the first message
    let sessionId = currentSessionId;
    if (isNewSession || !sessionId) {
      const newSession = chatHistoryService.saveSession({
        title: chatHistoryService.generateTitle(userInput),
        mode,
        messages: [...messages, userMessage]
      });
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
      setIsNewSession(false);
    } else {
      // Add user message to existing session
      chatHistoryService.addMessage(sessionId, userMessage);
    }

    try {
      // Determine endpoint based on mode
      let endpoint = '';
      switch (mode) {
        case 'Concept':
          endpoint = '/concept';
          break;
        case 'Literature Review':
          endpoint = '/literature_review';
          break;
        case 'Citation':
          endpoint = '/citation';
          break;
        case 'Exam Notes':
          endpoint = '/exam_notes';
          break;
      }

      // Send request to backend
      const response = await axios.post(CHATBOT_API_BASE + endpoint, {
        user_input: userInput
      });

      // Add bot response to chat
      const botMessage: Message = {
        role: 'bot',
        content: response.data.response,
        mode
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Add bot message to session
      if (sessionId) {
        chatHistoryService.addMessage(sessionId, botMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        role: 'bot',
        content: 'Sorry, there was an error processing your request. Please try again.',
        mode
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Add error message to session
      if (sessionId) {
        chatHistoryService.addMessage(sessionId, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsNewSession(true);
  };

  const handleSelectSession = (session: ChatSession) => {
    setMessages(session.messages);
    setMode(session.mode);
    setCurrentSessionId(session.id);
    setIsNewSession(false);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    clearChat();
    setShowHistory(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Biomedical Assistant</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Clear chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Close chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Mode:</label>
        <div className="grid grid-cols-2 gap-1">
          {['Concept', 'Literature Review', 'Citation', 'Exam Notes'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              className={`px-3 py-2 text-xs rounded-md transition-colors ${
                mode === m 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm">Start a conversation!</p>
            <p className="text-xs mt-1 text-gray-400">
              Mode: <span className="font-medium">{mode}</span>
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-xs font-medium mb-1 opacity-70">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask about ${mode.toLowerCase()}...`}
            className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSidebar;
