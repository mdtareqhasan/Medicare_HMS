import { useState, useEffect, useRef, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatService } from "@/api/chatService";
import {
  MessageSquare, Send, Search, User, Check, CheckCheck,
} from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Message {
  id: number;
  sender: UserProfile;
  receiver: UserProfile;
  message: string;
  readMessage: boolean;
  createdAt: string;
}

interface ChatContact {
  profile: UserProfile;
  lastMessage?: Message;
  unreadCount: number;
}

export default function Chat() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    try {
      const data = await chatService.getContacts();
      setProfiles(data.filter((p) => p.id !== user.id));
    } catch (error) {
      console.error("Failed to load contacts", error);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !selectedContact) return;
    try {
      const data = await chatService.getConversation(user.id, selectedContact.id);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  }, [user, selectedContact]);

  useEffect(() => {
    fetchProfiles();
    fetchMessages();
  }, [fetchProfiles, fetchMessages]);

  // Polling for new messages in current conversation
  useEffect(() => {
    if (!user || !selectedContact) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [user, selectedContact, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedContact]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (!selectedContact || !user) return;

    const unread = messages.filter(
      (m) => m.sender.id === selectedContact.id && m.receiver.id === user.id && !m.readMessage
    );

    if (unread.length > 0) {
      chatService.markConversationRead(user.id, selectedContact.id)
        .then(() => {
          setMessages((prev) => prev.map((m) =>
            unread.some((u) => u.id === m.id) ? { ...m, readMessage: true } : m
          ));
        })
        .catch((error) => console.error("Failed to mark conversation as read", error));
    }
  }, [selectedContact, messages, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    setSending(true);
    try {
      await chatService.sendMessage(user.id, selectedContact.id, newMessage.trim());
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Build contacts list with last message & unread count
  const contacts: ChatContact[] = profiles
    .filter((p) => p.username.toLowerCase().includes(search.toLowerCase()) || !search)
    .map((profile) => {
      const convMessages = messages.filter(
        (m) => (m.sender.id === profile.id && m.receiver.id === user?.id) ||
               (m.sender.id === user?.id && m.receiver.id === profile.id)
      );
      const lastMessage = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter(
        (m) => m.sender.id === profile.id && !m.readMessage
      ).length;
      return { profile, lastMessage, unreadCount };
    })
    .sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
    });

  const conversationMessages = selectedContact
    ? messages.filter(
        (m) => (m.sender.id === selectedContact.id && m.receiver.id === user?.id) ||
               (m.sender.id === user?.id && m.receiver.id === selectedContact.id)
      )
    : [];

  return (
    <div className="space-y-5">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Chat with doctors, patients, and staff</p>
      </div>

      <div className="dashboard-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Contacts List */}
          <div className="border-r border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-9 rounded-xl text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {contacts.map(({ profile, lastMessage, unreadCount }) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedContact(profile)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50 ${
                    selectedContact?.id === profile.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 shrink-0">
                    <User className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {profile.username || "Unnamed"}
                      </p>
                      {lastMessage && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(lastMessage.created_at), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMessage?.content || "No messages yet"}
                      </p>
                      {unreadCount > 0 && (
                        <Badge className="bg-secondary text-secondary-foreground h-5 min-w-5 text-[10px] px-1.5 shrink-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {contacts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No contacts found</div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10">
                    <User className="h-4.5 w-4.5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{selectedContact.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {conversationMessages.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground text-sm">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Start a conversation</p>
                      </div>
                    )}
                    {conversationMessages.map((msg) => {
                      const isMine = msg.sender.id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-accent text-accent-foreground rounded-bl-md"
                          }`}>
                            <p>{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${
                              isMine ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"
                            }`}>
                              <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                              {isMine && (msg.readMessage
                                ? <CheckCheck className="h-3 w-3" />
                                : <Check className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="rounded-xl h-10"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="gradient-btn text-white rounded-xl border-0 px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a contact to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
