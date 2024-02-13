import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateGravatarHash } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const VisitorAvatar = ({
  viewerEmail,
  className,
}: {
  viewerEmail: string | null;
  className?: string;
}) => {
  // Convert email string to a simple hash
  const hashString = (str: string) => {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  // Get the background color from the email number hash
  const getColorFromHash = (hash: number): string => {
    // An array of colors you want to choose from
    const colors = [
      "bg-gray-200/50",
      "bg-gray-300/50",
      "bg-gray-400/50",
      "bg-gray-500/50",
      "bg-gray-600/50",
    ];

    // Use the hash to get an index for the colors array
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (!viewerEmail) {
    return (
      <Avatar className={cn("flex-shrink-0 hidden sm:inline-flex", className)}>
        <AvatarFallback className="bg-gray-200/50 dark:bg-gray-200/50">
          AN
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn("flex-shrink-0 hidden sm:inline-flex", className)}>
      <AvatarImage
        src={`https://gravatar.com/avatar/${generateGravatarHash(
          viewerEmail,
        )}?s=80&d=404`}
      />

      <AvatarFallback
        className={`${getColorFromHash(
          hashString(viewerEmail),
        )} dark:${getColorFromHash(hashString(viewerEmail))}`}
      >
        {viewerEmail?.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
