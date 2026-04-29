import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Bot, CalendarPlus, HeartPulse, Loader2, MessageCircle, Pill, Send, Stethoscope, TestTube2, UserRoundSearch, X } from "lucide-react";

import axiosInstance from "@/api/axiosInstance";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface ChatbotResponse {
  reply: string;
}

interface ChatbotErrorResponse {
  error?: string;
}

const quickReplies = [
  {
    label: "Available Doctors",
    prompt: "Which doctors are available and what are their schedules?",
    icon: UserRoundSearch,
  },
  {
    label: "Book Appointment",
    prompt: "How can I book an appointment in Medicare Cure Hub?",
    icon: CalendarPlus,
  },
  {
    label: "Emergency Info",
    prompt: "What should I do in a medical emergency?",
    icon: HeartPulse,
  },
  {
    label: "Symptoms",
    prompt: "I have symptoms. How should I decide what kind of doctor to see?",
    icon: Stethoscope,
  },
  {
    label: "Medication Info",
    prompt: "What medication information should I check before taking a medicine?",
    icon: Pill,
  },
  {
    label: "Lab Results",
    prompt: "Can you explain common lab result terms in simple language?",
    icon: TestTube2,
  },
];

const roleGreeting: Record<AppRole | "guest", string> = {
  patient: "Hi, I am CureBot for Medicare Cure Hub. I can help you find doctors, understand basic health questions, and prepare for appointments.",
  doctor: "Hello Doctor, I can help with schedule-aware guidance, patient communication, and quick clinical references.",
  admin: "Hello Admin, I can help with doctor availability, appointment flow, and operational questions.",
  nurse: "Hello, I can help with patient guidance, appointments, and care coordination basics.",
  pharmacist: "Hello, I can help with general medication information and appointment guidance.",
  lab_staff: "Hello, I can help explain lab-result language in patient-friendly terms.",
  guest: "Hi, I am CureBot, the Medicare Cure Hub assistant. Ask me about doctors, appointments, symptoms, medication, or lab results.",
};

const createMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const formatMessage = (content: string) =>
  content.split("\n").map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={index} className="h-2" />;
    }

    const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      return (
        <div key={index} className="grid grid-cols-[1.5rem_1fr] gap-2">
          <span className="font-medium text-muted-foreground">{numbered[1]}.</span>
          <span>{numbered[2]}</span>
        </div>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={index} className="grid grid-cols-[0.8rem_1fr] gap-2">
          <span className="pt-1.5 text-muted-foreground">•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }

    if (trimmed.endsWith(":") && trimmed.length < 48) {
      return (
        <div key={index} className="mt-1 font-semibold">
          {trimmed}
        </div>
      );
    }

    return <p key={index}>{trimmed}</p>;
  });

export function AIChatbot() {
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const currentRole = role ?? "guest";
  const greeting = useMemo(() => roleGreeting[currentRole], [currentRole]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: createMessageId(),
          role: "assistant",
          content: greeting,
        },
      ]);
    }
  }, [greeting, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const history = nextMessages
        .slice(-7, -1)
        .map(({ role: messageRole, content: messageContent }) => ({
          role: messageRole,
          content: messageContent,
        }));

      const response = await axiosInstance.post<ChatbotResponse>("/chatbot/chat", {
        message: trimmed,
        role: currentRole,
        history,
      });

      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId(),
          role: "assistant",
          content: response.data.reply || "I could not generate a response just now.",
        },
      ]);
    } catch (err) {
      const axiosError = err as AxiosError<ChatbotErrorResponse>;
      const message =
        axiosError.response?.data?.error ||
        "The assistant is having trouble connecting. Please try again in a moment.";
      setError(message);
      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId(),
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section className="flex h-[min(680px,calc(100vh-6rem))] w-[min(440px,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-lg border bg-background shadow-2xl">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">Medicare Cure Hub Assistant</h2>
                <p className="truncate text-xs text-muted-foreground">CureBot • AI Care Assistant</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <ScrollArea className="min-h-0 flex-1 px-4 py-4">
            <div className="space-y-3 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[92%] overflow-hidden break-words rounded-lg px-3 py-2 text-sm leading-6 [overflow-wrap:anywhere]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border bg-muted/50 text-foreground",
                    )}
                  >
                    <div className="space-y-1.5">{formatMessage(message.content)}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[88%] items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t p-3">
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickReplies.map((reply) => (
                <Button
                  key={reply.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-10 whitespace-normal px-2 text-center text-xs leading-4"
                  disabled={isLoading}
                  onClick={() => sendMessage(reply.prompt)}
                >
                  <reply.icon className="h-3.5 w-3.5" />
                  {reply.label}
                </Button>
              ))}
            </div>

            {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask about doctors, appointments, symptoms, medication, or lab results"
                className="min-h-10 max-h-28 min-w-0 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={1}
                disabled={isLoading}
                aria-label="Message Medicare Cure Hub assistant"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} aria-label="Send message">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </section>
      )}

      <Button
        type="button"
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Hide AI assistant" : "Open AI assistant"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
