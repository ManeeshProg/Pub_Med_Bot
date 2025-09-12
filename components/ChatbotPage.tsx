import React, { useState } from 'react';
import axios from 'axios';
import { CHATBOT_API_BASE } from '../constants';

interface Message {
  role: 'user' | 'bot';
  content: string;
  mode?: string;
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'Concept' | 'Literature Review' | 'Citation' | 'Exam Notes'>('Concept');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input, mode };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

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
        user_input: input
      });

      // Add bot response to chat
      const botMessage: Message = {
        role: 'bot',
        content: response.data.response,
        mode
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        role: 'bot',
        content: 'Sorry, there was an error processing your request. Please try again.',
        mode
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Biomedical Chatbot</h1>
      
      {/* Mode selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Mode:</label>
        <div className="flex flex-wrap gap-2">
          {['Concept', 'Literature Review', 'Citation', 'Exam Notes'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              className={`px-4 py-2 rounded-md ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start a conversation!</p>
            <p className="mt-2 text-sm">
              Current mode: <span className="font-semibold">{mode}</span>
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-gray-100 mr-12'}`}
            >
              <div className="font-semibold mb-1">
                {msg.role === 'user' ? 'You' : 'Biomedical Tutor'}
                {msg.mode && <span className="text-xs ml-2 text-gray-500">Mode: {msg.mode}</span>}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask about ${mode.toLowerCase()}...`}
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatbotPage;