import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

import { useDocumentLinks } from "@/lib/swr/use-document";
import toast from "react-hot-toast";
import Notification from "../Notification";
import BarChart from "../shared/icons/bar-chart";
import { nFormatter, timeAgo } from "@/lib/utils";
import MoreHorizontal from "../shared/icons/more-horizontal";
import { Skeleton } from "../ui/skeleton";


export default function LinksTable() {
  const { links } = useDocumentLinks();

  const handleCopyToClipboard = (id: string) => {
    navigator.clipboard
      .writeText(`${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`)
      .catch((error) => {
        console.log("Failed to copy text to clipboard", error);
      });

    toast.custom((t) => (
      <Notification
        visible={t.visible}
        closeToast={() => toast.dismiss(t.id)}
        message={``}
      />
    ));
  };
  
  return (
    <div className="w-full sm:p-4">
      <div>
        <h2 className="p-4">All links</h2>
      </div>
      <div className="rounded-md sm:border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium w-[250px]">Link</TableHead>
              <TableHead className="font-medium">Views</TableHead>
              <TableHead className="font-medium">Last Viewed</TableHead>
              <TableHead className="font-medium text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links ? (
              links.map((link) => (
                <Collapsible asChild>
                  <>
                    <TableRow key={link.id} className="group/row">
                      <TableCell>{link.name || "No link name"}</TableCell>
                      <TableCell className="min-w-[260px] sm:min-w-[450px]">
                        <div className="group/cell flex items-center gap-x-4 rounded-md bg-gray-700 px-3 py-1 group-hover/row:ring-1 group-hover/row:ring-gray-100 hover:bg-gray-200 transition-all">
                          <div className="whitespace-nowrap hidden sm:flex text-sm text-gray-300 group-hover/cell:hidden">{`https://papermark.io/view/${link.id}`}</div>
                          <div className="flex sm:hidden whitespace-nowrap text-sm text-gray-300 group-hover/cell:hidden">{`${link.id}`}</div>
                          <button
                            className="whitespace-nowrap text-sm text-center text-black hidden group-hover/cell:block w-full"
                            onClick={() => handleCopyToClipboard(link.id)}
                            title="Copy to clipboard"
                          >
                            Copy to Clipboard
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center space-x-1">
                            <BarChart className="h-4 w-4 text-gray-400" />
                            <p className="whitespace-nowrap text-sm text-gray-400">
                              {nFormatter(link._count.views)}
                              <span className="ml-1 hidden sm:inline-block">
                                views
                              </span>
                            </p>
                          </div>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {link.views[0] ? (
                          <time
                            dateTime={new Date(
                              link.views[0].viewedAt
                            ).toISOString()}
                          >
                            {timeAgo(link.views[0].viewedAt)}
                          </time>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit Link</DropdownMenuItem>
                            <DropdownMenuItem>Make copy</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 focus:text-red-200 focus:bg-red-900">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-gray-700 hover:bg-gray-700">
                        <TableCell colSpan={5}>
                          Yes. Free to use for personal and commercial projects.
                          No attribution required.
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell className="min-w-[100px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell className="min-w-[450px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}