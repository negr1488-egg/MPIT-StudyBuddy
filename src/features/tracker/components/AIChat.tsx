// /src/features/tracker/components/AIChat.tsx
import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { sendChatMessage } from '../../../services/gigachat/client'; // путь сохранён

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(
        updatedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      );
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      // можно показать ошибку в чате, если нужно
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Произошла ошибка при отправке сообщения.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">AI‑помощник</h3>
      <div className="h-64 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && <Bot className="h-5 w-5 text-indigo-600 mt-1" />}
            <p
              className={`max-w-[80%] rounded-xl p-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              {msg.content}
            </p>
            {msg.role === 'user' && <User className="h-5 w-5 text-slate-400 mt-1" />}
          </div>
        ))}
        {loading && <p className="text-sm text-slate-400">ИИ печатает...</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Спроси о задачах..."
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
