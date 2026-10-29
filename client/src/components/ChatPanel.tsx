import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Wrench } from 'lucide-react';
import { sendChatMessage } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCallsMade?: Array<{
    name: string;
    args: any;
    result?: any;
    error?: string;
  }>;
  suggestedAction?: 'CONFIRMATION_REQUIRED' | 'SUBMISSION_COMPLETE' | null;
  applicationSummary?: any;
}

const STARTER_PROMPTS = [
  'I have 45 grams of 22 carat jewellery, how much can I get?',
  'What are your active gold loan schemes and interest rates?',
  'I have 50 grams of gold jewellery, calculate my loan.',
  'My gold is 52g net and 50g gross weight, 22K.',
];

export const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Gold Loan Assistant. I can check your loan eligibility based on your jewellery weight and purity, explain repayment plans, and help submit your application.\n\nHow much gold jewellery do you have today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeToolChip, setActiveToolChip] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, activeToolChip]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    // Simulate tool chips based on user prompt for delightful UX
    const lower = text.toLowerCase();
    if (lower.includes('scheme') || lower.includes('plan') || lower.includes('interest')) {
      setActiveToolChip('Calling get_loan_schemes()...');
    } else if (lower.includes('gram') || lower.includes('g') || lower.includes('karat')) {
      setActiveToolChip('Calling calculate_quote(net, gross, karat)...');
    } else if (lower.includes('yes') || lower.includes('submit') || lower.includes('confirm')) {
      setActiveToolChip('Calling submit_application()...');
    } else {
      setActiveToolChip('Evaluating loan query & guardrails...');
    }

    try {
      const response = await sendChatMessage(
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
          toolCallsMade: response.toolCallsMade,
          suggestedAction: response.suggestedAction,
          applicationSummary: response.applicationSummary,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error communicating with assistant: ${err.message || 'Server error'}`,
        },
      ]);
    } finally {
      setLoading(false);
      setActiveToolChip(null);
    }
  };

  const handleQuickConfirm = (confirmText: string) => {
    handleSend(confirmText);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[650px] overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span>Loan Assist AI Agent</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </h3>
            <p className="text-xs text-slate-400">Function Calling · Strict Financial Guardrails · Zero Math Guesswork</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
            Backed by Zod Validation
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-amber-400 font-bold'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] space-y-2`}>
              {/* Tool Execution Chips */}
              {m.toolCallsMade && m.toolCallsMade.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {m.toolCallsMade.map((tool, tIdx) => (
                    <span
                      key={tIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-100/80 text-amber-900 border border-amber-200"
                    >
                      <Wrench className="w-3 h-3 text-amber-700" />
                      <span>tool: {tool.name}()</span>
                      {tool.error && <span className="text-rose-600 font-bold">⚠️ invalid</span>}
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-sm'
                    : 'bg-white text-slate-800 rounded-tl-none shadow-xs border border-slate-200/80'
                }`}
              >
                {m.content}
              </div>

              {/* Action Confirmation Card */}
              {m.suggestedAction === 'CONFIRMATION_REQUIRED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Explicit Submission Confirmation Required</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    Click to confirm submission, or ask the agent to change any details:
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleQuickConfirm('Yes, please submit my application.')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      ✓ Yes, Confirm & Submit
                    </button>
                    <button
                      onClick={() => handleQuickConfirm('Wait, I want to change details.')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Modify
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading and active tool chip */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1.5">
              {activeToolChip && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                  <Wrench className="w-3 h-3 text-amber-700 animate-spin" />
                  <span>{activeToolChip}</span>
                </div>
              )}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>Agent is generating response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs text-slate-600 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Try:</span>
        {STARTER_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="shrink-0 bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message (e.g. 'I have 45 grams of 22K jewellery')..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-2.5 rounded-xl transition-all ${
              input.trim() && !loading
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
