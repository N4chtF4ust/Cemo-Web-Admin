import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "~/components/ui/select";
import { UserRole } from "~/lib/firestore/users";
import type { UserProfile } from "~/lib/firestore/users";

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  user?: UserProfile | null;
}

export function UserDialog({ isOpen, onClose, onSave, user }: UserDialogProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    email: "",
    displayName: "",
    firstName: "",
    lastName: "",
    photoUrl: "",
    role: UserRole.USER,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        displayName: user.displayName || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        photoUrl: user.photoUrl || "",
        role: user.role,
      });
    } else {
      setFormData({
        email: "",
        displayName: "",
        firstName: "",
        lastName: "",
        photoUrl: "",
        role: UserRole.USER,
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white font-bold text-xl">
            {user ? "Edit User Profile" : "Add New User"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">First Name</label>
              <Input 
                value={formData.firstName || ""} 
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Name</label>
              <Input 
                value={formData.lastName || ""} 
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Display Name</label>
            <Input 
              value={formData.displayName || ""} 
              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20"
              placeholder="johndoe_cemo"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
            <Input 
              type="email"
              value={formData.email || ""} 
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20"
              placeholder="john@cemo.tech"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Photo URL</label>
            <Input 
              value={formData.photoUrl || ""} 
              onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
              className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">System Role</label>
            <Select 
              value={formData.role} 
              onValueChange={value => setFormData({ ...formData, role: value as UserRole })}
            >
              <SelectTrigger className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10 rounded-xl">
                <SelectItem value={UserRole.USER}>Standard User</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user && (
            <div className="pt-4 border-t border-zinc-100 dark:border-white/5 space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                <span>UID: {user.uid}</span>
              </div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                <span>Created: {user.createdAt.toLocaleDateString()}</span>
                <span>Updated: {user.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl border-zinc-200 dark:border-white/10 bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-xl bg-cemo-primary text-black hover:bg-cemo-primary/90 font-bold px-8 shadow-[0_0_15px_rgba(57,255,20,0.2)]"
            >
              {loading ? "Saving..." : user ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
