import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CalendarCheck, FlaskConical, CreditCard, Pill, Info, Check } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { notificationService } from "@/api/notificationService";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Info> = {
  appointment: CalendarCheck,
  lab: FlaskConical,
  billing: CreditCard,
  prescription: Pill,
  info: Info,
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const data = await notificationService.getNotifications();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data && typeof data === 'object') {
          // If it's an object with a notifications property
          setNotifications(data.notifications || []);
        } else {
          setNotifications([]);
        }
      } catch (error: any) {
        console.error("[NotificationBell] Failed to load notifications", error);
        setNotifications([]);
      }
    };

    loadNotifications();
  }, [user]);

  // Filter unread notifications - ensure notifications is always an array
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.is_read).length : 0;
  
  // Normalize older string ids (in case legacy code injects as string)
  useEffect(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, id: Number(n.id) })));
  }, []);

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error: any) {
      console.error("Failed to mark all read", error);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    try {
      await notificationService.markRead(n.id);
      setNotifications((prev) => 
        prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item)
      );
      if (n.link) {
        setOpen(false);
        navigate(n.link);
      }
    } catch (error: any) {
      console.error("Failed to mark read", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-0 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <Check className="h-3 w-3 mr-1" /> Mark read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No notifications</div>
          ) : (
            notifications.map((n) => {
              const NIcon = TYPE_ICONS[n.type] || Info;
              return (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full flex items-start gap-3 p-3 text-left hover:bg-accent/50 ${!n.is_read ? "bg-secondary/5" : ""}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent shrink-0">
                    <NIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {n.created_at ? format(new Date(n.created_at), "dd MMM, HH:mm") : "—"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}