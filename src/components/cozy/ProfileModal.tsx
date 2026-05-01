import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCozy } from "@/store/cozyStore";
import { toast } from "@/hooks/use-toast";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PW";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { state, setUser } = useCozy();
  const [name, setName] = useState(state.user.name);
  const [avatar, setAvatar] = useState(state.user.avatar);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(state.user.name);
    setAvatar(state.user.avatar);
    setError("");
  }, [open, state.user.avatar, state.user.name]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for your avatar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Username cannot be empty.");
      return;
    }

    setUser({ name: trimmedName, avatar });
    toast({ title: "Profile saved", description: "Your profile details were updated." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-sm border-2 border-pixel-border bg-card p-0 text-foreground shadow-[0_6px_24px_-8px_hsl(232_23%_5%/0.8)] glow-primary">
        <DialogHeader className="border-b-2 border-pixel-border bg-surface px-6 py-4 text-left">
          <DialogDescription className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary">
            Profile
          </DialogDescription>
          <DialogTitle className="font-pixel text-2xl text-foreground">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-sm border-2 border-primary/50 bg-gradient-to-br from-primary/30 to-secondary/30 glow-primary">
              {avatar && <AvatarImage src={avatar} alt={`${name || state.user.name} avatar`} className="object-cover" />}
              <AvatarFallback className="rounded-sm bg-transparent font-pixel text-xl text-foreground">
                {getInitials(name || state.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-pixel text-base text-foreground">{name.trim() || state.user.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{state.user.level}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-name" className="font-pixel text-xs text-muted-foreground">
              Username
            </label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError("");
              }}
              className="rounded-sm border-2 border-pixel-border bg-background font-medium focus-visible:ring-primary/20"
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <p className="font-pixel text-xs text-muted-foreground">Profile Picture</p>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-sm border-2 border-pixel-border bg-background px-4 font-pixel text-sm text-foreground transition-colors hover:border-primary/60 press-down">
              <Upload className="h-4 w-4" />
              Upload Image
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="rounded-sm border-2 border-pixel-border bg-background p-3">
            <p className="font-pixel text-xs text-muted-foreground">Level / Title</p>
            <p className="mt-1 text-sm text-foreground">{state.user.level}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-sm border-2 border-pixel-border bg-background font-pixel hover:border-primary/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-sm border-2 border-primary/60 font-pixel hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
