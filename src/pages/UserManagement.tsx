import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Users,
  UserCircle,
  Shield,
  Trash2,
  Edit,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/api/userService";
import { AddUserDialog } from "@/components/users/AddUserDialog";

// --- Types ---
type AppRole =
  | "admin"
  | "doctor"
  | "patient"
  | "pharmacist"
  | "nurse"
  | "lab_staff";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  patient: "Patient",
  pharmacist: "Pharmacist",
  lab_staff: "Laboratory Staff",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  doctor: "bg-secondary/10 text-secondary border-secondary/20",
  nurse: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  patient: "bg-muted text-muted-foreground border-border",
  pharmacist: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  lab_staff: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole;
  role_id: string;
}

export default function UserManagement() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("patient");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);

  // --- Functions ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      const userWithRoles: UserWithRole[] = data.map((item) => ({
        user_id: item.email || "N/A",
        full_name: item.username || "Unnamed",
        phone: null,
        gender: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        role: (item.role?.toLowerCase() as AppRole) || "patient",
        role_id: item.id.toString(),
      }));
      setUsers(userWithRoles);
    } catch (error: any) {
      toast.error(
        "Failed to load users: " + (error?.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await userService.updateUserRole(
        Number(editUser.role_id),
        newRole.toUpperCase(),
      );
      toast.success(
        `${editUser.full_name} role updated to ${ROLE_LABELS[newRole]}`,
      );
      setEditUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(
        "Failed to update role: " + (error?.message || "Unknown error"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;

    setDeleting(true);
    try {
      await userService.deleteUser(Number(deleteUserTarget.role_id));
      toast.success(`${deleteUserTarget.full_name} deleted successfully`);
      setDeleteUserTarget(null);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to delete user: " + (error?.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      (u.full_name || "").toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // --- Guard Clause (IMPORTANT: Fixes White Screen) ---
  if (role?.toLowerCase() !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background">
        <Shield className="h-12 w-12 mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>
          You don't have permission to view this page. Current Role:{" "}
          {role || "None"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 lg:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system roles and access control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAddUserOpen(true)}
            className="rounded-xl"
          >
            <UserPlus className="h-4 w-4 mr-1" /> Add User
          </Button>
          <Badge variant="secondary" className="text-sm px-3 py-1.5">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(filterRole === r ? "all" : r)}
            className={`p-4 rounded-2xl border bg-card transition-all hover:shadow-md ${
              filterRole === r
                ? "ring-2 ring-primary border-transparent"
                : "border-border"
            }`}
          >
            <p className="text-2xl font-bold">{roleCounts[r] || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {ROLE_LABELS[r]}
            </p>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-2xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            Loading users...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.role_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.user_id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${ROLE_COLORS[user.role]}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditUser(user);
                          setNewRole(user.role);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteUserTarget(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              <UserCircle className="h-10 w-10" />
              <div>
                <p className="font-bold">{editUser?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {editUser?.user_id}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="role-select">Select role</Label>
              <Select id="role-select" value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as AppRole[]).map((roleOption) => (
                    <SelectItem key={roleOption} value={roleOption}>
                      {ROLE_LABELS[roleOption]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditUser(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={saving}
              className="rounded-xl"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserTarget} onOpenChange={(open) => { if (!open) setDeleteUserTarget(null); }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUserTarget?.full_name || "this user"}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground rounded-xl"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSuccess={() => {
          fetchUsers();
          setAddUserOpen(false);
        }}
        defaultRole="patient"
      />
    </div>
  );
}
