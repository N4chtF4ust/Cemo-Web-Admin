import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "~/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { UserRole } from "~/lib/firestore/users";
import type { UserProfile } from "~/lib/firestore/users";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Mail01Icon, 
  UserCircleIcon, 
  FingerPrintIcon, 
  Calendar01Icon,
  Clock01Icon
} from "@hugeicons/core-free-icons";

interface UserDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

function UserDetails({ isOpen, onClose, user }: UserDetailsProps) {
  if (!user) return null;

  const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "") || user.displayName?.[0] || user.email[0];
  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.displayName ||
    user.email.split("@")[0];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-l border-zinc-200 dark:border-white/10 sm:max-w-[450px]">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-zinc-900 dark:text-white font-bold text-2xl">User Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-8 px-2">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="size-24 border-2 border-cemo-primary/20 p-1">
              <AvatarImage src={user.photoUrl || ""} />
              <AvatarFallback className="bg-cemo-primary/10 text-cemo-primary font-bold text-2xl">{initials.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {fullName}
              </h3>
              <p className="text-zinc-500 font-medium">{user.displayName || "No display name"}</p>
              <Badge className={user.role === UserRole.ADMIN ? "bg-cemo-primary/20 text-cemo-primary border-cemo-primary/30 mt-2" : "bg-zinc-100 dark:bg-white/5 text-zinc-500 border-zinc-200/50 dark:border-white/10 mt-2"}>
                {user.role}
              </Badge>
            </div>
          </div>

          <Separator className="bg-zinc-100 dark:bg-white/5" />

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500">
                <HugeiconsIcon icon={UserCircleIcon} className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Profile Type</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {user.isIndividual ? "Individual" : "Establishment"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500">
                <HugeiconsIcon icon={UserCircleIcon} className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Establishment Name</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{user.establishmentName || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500">
                <HugeiconsIcon icon={UserCircleIcon} className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Establishment Address</p>
                <p className="text-xs text-zinc-500">{user.establishmentAddress || "No address provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500">
                <HugeiconsIcon icon={Mail01Icon} className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500">
                <HugeiconsIcon icon={FingerPrintIcon} className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">User ID</p>
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">{user.uid}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500">
                <HugeiconsIcon icon={Calendar01Icon} className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Member Since</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{user.createdAt.toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500">
                <HugeiconsIcon icon={Clock01Icon} className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Last Updated</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{user.updatedAt.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { UserDetails };
export default UserDetails;
