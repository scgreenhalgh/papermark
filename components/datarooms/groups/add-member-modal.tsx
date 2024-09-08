import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useAnalytics } from "@/lib/analytics";

export function AddGroupMemberModal({
  dataroomId,
  groupId,
  open,
  setOpen,
  children,
}: {
  dataroomId: string;
  groupId: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const teamInfo = useTeam();
  const analytics = useAnalytics();

  // Email validation regex pattern
  const validateEmail = (email: string) => {
    return email.match(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    setInputValue(inputValue);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const emails = inputValue
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email);

    if (emails.length === 0) return;

    setLoading(true);

    // validate emails
    const invalidEmails = emails.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      setLoading(false);
      toast.error("Found one or more invalid email addresses.");
      return;
    }

    // POST request with multiple emails
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/groups/${groupId}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: emails,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      setLoading(false);
      setOpen(false);
      toast.error(error.message || "Failed to send invitations.");
      return;
    }

    analytics.capture("Dataroom View Invitation Sent", {
      inviteeCount: emails.length,
      teamId: teamInfo?.currentTeam?.id,
      dataroomId: dataroomId,
    });

    mutate(
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/groups/${groupId}`,
    );

    toast.success("Invitation emails have been sent!");
    setOpen(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add members</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="email">Email addresses</Label>
          <div className="flex flex-col gap-2 py-2 text-sm">
            <Textarea
              value={inputValue}
              onChange={handleInputChange}
              rows={5}
              id="email"
              placeholder="jane@acme.com, john@acme.com"
              className="flex-1 bg-muted"
              autoComplete="off"
            />
            <small className="text-xs text-muted-foreground">
              Use comma to separate multiple email addresses.
            </small>
          </div>

          <DialogFooter>
            <Button type="submit" className="mt-6 h-9 w-full" loading={loading}>
              {loading ? "Adding members..." : "Add members"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
