import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/context/team-context";
import { useAnalytics } from "@/lib/analytics";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export function AddViewerModal({
  dataroomId,
  open,
  setOpen,
  children,
}: {
  dataroomId: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const [emails, setEmails] = useState<string[]>([]);
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

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const val = e.target.value;
  //   setInputValue(val);

  //   if (val.endsWith(",")) {
  //     const newEmail = val.slice(0, -1).trim(); // Remove the comma and trim whitespace
  //     if (validateEmail(newEmail) && !emails.includes(newEmail)) {
  //       setEmails([...emails, newEmail]); // Add the new email if it's valid and not already in the list
  //       setInputValue(""); // Reset input field
  //     }
  //   }
  // };

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const inputValue = e.target.value;
  //   setInputValue(inputValue);

  //   // Split the input value by commas to support pasting comma-separated emails
  //   const potentialEmails = inputValue
  //     .split(",")
  //     .map((email) => email.trim())
  //     .filter((email) => email);

  //   const newEmails: string[] = [];
  //   potentialEmails.forEach((email) => {
  //     // Check if the email is valid and not already included
  //     if (validateEmail(email) && !emails.includes(email)) {
  //       newEmails.push(email);
  //     }
  //   });

  //   // If there are new valid emails, update the state
  //   if (newEmails.length > 0) {
  //     setEmails([...emails, ...newEmails]);
  //     setInputValue(""); // Reset input field only if new emails were added
  //   }
  // };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputValue(inputValue);
  };

  const handleInputBlurOrComma = () => {
    // Split the current input value by commas in case of pasting multiple emails
    const potentialEmails = inputValue
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    const newEmails = potentialEmails.filter((email) => {
      // Validate each email and check it's not already in the list
      return validateEmail(email) && !emails.includes(email);
    });

    if (newEmails.length > 0) {
      setEmails([...emails, ...newEmails]); // Add new valid emails to the list
      setInputValue(""); // Clear input field
    }
  };

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (emails.length === 0) return;

    setLoading(true);

    // POST request with multiple emails
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/users`,
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
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/viewers`,
    );

    toast.success("Invitation emails have been sent!");
    setOpen(false);
    setLoading(false);
    setEmails([]); // Reset emails state
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Invite Visitors</DialogTitle>
          <DialogDescription>
            Enter email addresses, separated by commas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="email" className="opacity-80">
            Emails
          </Label>
          <div className="flex flex-wrap gap-2 py-2  text-sm">
            {emails.map((email, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded"
              >
                {email}
                <button type="button" onClick={() => removeEmail(index)}>
                  ×
                </button>
              </div>
            ))}
            <Input
              id="email"
              value={inputValue}
              placeholder="example@domain.com"
              className="flex-1"
              onChange={handleInputChange}
              onBlur={handleInputBlurOrComma} // Handle when input loses focus
              onKeyDown={(e) => {
                if (e.key === ",") {
                  e.preventDefault(); // Prevent the comma from being added to the input
                  handleInputBlurOrComma(); // Act as if the input lost focus to process the email
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full h-9 mt-8" loading={loading}>
              {loading ? "Sending emails..." : "Add members"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
