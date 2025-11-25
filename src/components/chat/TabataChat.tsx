"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Trash2, Loader2, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function TabataChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when opening
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loadHistory]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) {
        throw new Error("Error sending message");
      }

      const data = await res.json();

      // Replace temp message and add assistant response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [...filtered, data.userMessage, data.assistantMessage];
      });
    } catch (error) {
      console.error("Error:", error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm("¿Estás seguro de que deseas borrar todo el historial de chat?")) {
      return;
    }

    try {
      const res = await fetch("/api/chat/clear", { method: "POST" });
      if (res.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-gray-500 hover:bg-gray-600"
            : "bg-primary hover:bg-primary-dark"
        }`}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat con Tabata"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Tabata</h3>
                <p className="text-xs text-white/80">Asistente del consultorio</p>
              </div>
            </div>
            <button
              onClick={clearHistory}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              title="Borrar historial"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-background p-4">
            {isLoadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h4 className="mb-2 font-medium text-text-dark">¡Hola! Soy Tabata</h4>
                <p className="text-sm text-text-muted">
                  Tu asistente para gestionar el consultorio.
                  <br />
                  ¿En qué puedo ayudarte?
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-white"
                          : "bg-white text-text-dark shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      <p
                        className={`mt-1 text-right text-xs ${
                          message.role === "user"
                            ? "text-white/70"
                            : "text-text-muted"
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-border bg-white p-4"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
