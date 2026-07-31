import React, { useState } from "react";
import { PageHeader } from "../../../components/common/PageHeader.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { Checkbox } from "../../../components/ui/checkbox.js";
import { RadioGroup, Radio } from "../../../components/ui/radio-group.js";
import { Switch } from "../../../components/ui/switch.js";
import { Tag } from "../../../components/ui/tag.js";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../../components/ui/tooltip.js";
import { Popover, PopoverTrigger, PopoverContent } from "../../../components/ui/popover.js";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar.js";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "../../../components/ui/dropdown.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs.js";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../../components/ui/accordion.js";
import { Skeleton } from "../../../components/ui/skeleton.js";
import { LoadingSpinner } from "../../../components/ui/loading-spinner.js";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "../../../components/ui/dialog.js";
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from "../../../components/ui/drawer.js";
import { DataTable } from "../../../components/ui/data-table.js";
import { isMockEnabled, setMockEnabled } from "../../../mocks/index.js";
import { toast } from "sonner";
import { Info, HelpCircle, ShieldCheck, RefreshCw } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

interface SampleRow {
  id: string;
  name: string;
  role: string;
  status: string;
}

export function Playground() {
  const [mockActive, setMockActive] = useState(isMockEnabled());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);

  const handleMockToggle = (checked: boolean) => {
    setMockEnabled(checked);
    setMockActive(checked);
    toast.success(`Mock adapter layer ${checked ? "enabled" : "disabled"}.`);
  };

  const sampleData: SampleRow[] = [
    { id: "1", name: "Alex Admin", role: "Administrator", status: "Active" },
    { id: "2", name: "Sarah Technic", role: "IT Support Tech", status: "Active" },
    { id: "3", name: "John Student", role: "Student Member", status: "Inactive" },
  ];

  const columns: ColumnDef<SampleRow>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Full Name" },
    { accessorKey: "role", header: "System Role" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return (
          <Tag variant={val === "Active" ? "success" : "secondary"}>
            {val}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <PageHeader
          title="CampusCare Playground"
          description="Interactive design lab to inspect React components, verify accessibility, dark themes, and mock states."
        />
        <Card className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-border/60">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Mock Database Adapter</span>
            <span className="text-xs font-semibold text-foreground">{mockActive ? "Mock Mode Active" : "Real Server Mode"}</span>
          </div>
          <Switch checked={mockActive} onCheckedChange={handleMockToggle} />
        </Card>
      </div>

      <Tabs value="atoms" onValueChange={() => {}} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="atoms">Atoms & Forms</TabsTrigger>
          <TabsTrigger value="overlays">Dialogs & Sheets</TabsTrigger>
          <TabsTrigger value="data">Data Table & Loaders</TabsTrigger>
        </TabsList>

        {/* --- ATOMS & FORMS --- */}
        <TabsContent value="atoms" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Buttons Showcase */}
            <Card>
              <CardHeader>
                <CardTitle>Button Primitives</CardTitle>
                <CardDescription>Buttons support six semantic variants and four size categories.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2.5">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link Style</Button>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">Small size</Button>
                <Button variant="primary" size="md">Medium size</Button>
                <Button variant="primary" size="lg">Large size</Button>
                <Button variant="outline" size="icon" aria-label="Quick Action">
                  <ShieldCheck className="size-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Inputs & Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Visual state checks for error conditions and focused outlines.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Username</label>
                    <Input placeholder="Enter username" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-destructive uppercase">Password (Error)</label>
                    <Input type="password" placeholder="••••••••" error />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
                  <Textarea placeholder="Describe the issue details here..." />
                </div>
              </CardContent>
            </Card>

            {/* Selection & Toggles */}
            <Card>
              <CardHeader>
                <CardTitle>Selection Options</CardTitle>
                <CardDescription>Custom Select inputs, checkboxes, radios, and switches.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Role Selection</label>
                    <Select onValueChange={(val) => toast.info(`Selected role: ${val}`)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="tech">Technician</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="terms" />
                    <label htmlFor="terms" className="text-xs font-semibold text-foreground select-none cursor-pointer">
                      I accept terms & conditions
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Priority Level</label>
                    <RadioGroup>
                      <Radio name="priority" value="low" label="Low Priority" />
                      <Radio name="priority" value="med" label="Medium Priority" defaultChecked />
                      <Radio name="priority" value="high" label="High Priority" />
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popups & Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Popovers & Info Triggers</CardTitle>
                <CardDescription>Accessible tooltips and interactive popover items.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <HelpCircle className="size-4" />
                        Hover Tooltip
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      This tooltip matches the Radix provider specifications.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Info className="size-4" />
                      Open Popover
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 border border-border">
                    <h4 className="font-bold text-xs">Dynamic Popover</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-normal">
                      Radix portal renders this outside layout nodes safely.
                    </p>
                  </PopoverContent>
                </Popover>

                <div className="flex gap-1.5">
                  <Tag variant="primary">Ticket</Tag>
                  <Tag variant="success">Resolved</Tag>
                  <Tag variant="warning">Warning</Tag>
                  <Tag variant="destructive">Critical</Tag>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- DIALOGS & DRAWERS --- */}
        <TabsContent value="overlays" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {/* Modal Dialog */}
            <Card>
              <CardHeader>
                <CardTitle>Radix Dialog</CardTitle>
                <CardDescription>Overlay modal dialog supporting keyboard dismiss and scroll lock.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">Launch Dialog Modal</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md border border-border">
                    <DialogHeader>
                      <DialogTitle>Evaluate Asset Status</DialogTitle>
                      <DialogDescription>
                        Confirm evaluation parameters before changing asset logs.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-xs text-muted-foreground leading-relaxed">
                      Confirming this operation updates audit tracking systems.
                    </div>
                    <DialogFooter>
                      <DialogTrigger asChild>
                        <Button variant="outline">Dismiss</Button>
                      </DialogTrigger>
                      <Button onClick={() => toast.success("Asset verified successfully!")}>
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Bottom Drawer */}
            <Card>
              <CardHeader>
                <CardTitle>Vaul Drawer / Sheet</CardTitle>
                <CardDescription>Mobile-friendly slide-up bottom sheet with gesture dismiss.</CardDescription>
              </CardHeader>
              <CardContent>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="secondary" className="w-full">Open Bottom Drawer</Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-w-lg mx-auto border border-border">
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground">Mobile Navigation Shell</h3>
                        <p className="text-xs text-muted-foreground">
                          Provides support for compact displays and touch navigation.
                        </p>
                      </div>
                      <div className="h-40 rounded bg-muted/30 border border-border/40 flex items-center justify-center text-xs text-muted-foreground font-semibold">
                        Custom Content Box
                      </div>
                      <DrawerClose asChild>
                        <Button variant="outline" className="w-full">Close Sheet</Button>
                      </DrawerClose>
                    </div>
                  </DrawerContent>
                </Drawer>
              </CardContent>
            </Card>

            {/* Confirmation Alert */}
            <Card>
              <CardHeader>
                <CardTitle>Delete Confirmation</CardTitle>
                <CardDescription>Standard destructive prompts wrapper built on Dialog.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full" onClick={() => setIsConfirmOpen(true)}>
                  Trigger Alert Dialog
                </Button>
                <ConfirmDialog
                  isOpen={isConfirmOpen}
                  onClose={() => setIsConfirmOpen(false)}
                  onConfirm={() => {
                    setIsAlerting(true);
                    setTimeout(() => {
                      setIsAlerting(false);
                      setIsConfirmOpen(false);
                      toast.success("Record deleted successfully.");
                    }, 1000);
                  }}
                  title="Remove Asset Tag?"
                  description="This action is permanent and deletes related record metrics."
                  confirmText="Delete Tag"
                  isConfirming={isAlerting}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Dropdown Menu */}
            <Card>
              <CardHeader>
                <CardTitle>Dropdown Trigger Contexts</CardTitle>
                <CardDescription>Supports nested item labels and disabled items.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Trigger Dropdown</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 border border-border">
                    <DropdownMenuLabel>Management Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toast.info("View Details selected")}>View Details</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toast.info("Edit Entry selected")}>Edit Entry</DropdownMenuItem>
                    <DropdownMenuItem disabled>Reassign Ticket (Disabled)</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toast.info("Audit log logged")} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete Entry</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">John Doe</p>
                    <p className="text-[10px] text-muted-foreground">Avatar Fallback active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accordion List */}
            <Card>
              <CardHeader>
                <CardTitle>Accordion Panels</CardTitle>
                <CardDescription>Collapsible accordion blocks with smooth transitions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I reset my SIS student credentials?</AccordionTrigger>
                    <AccordionContent>
                      Submit a ticket under SIS category or use temporary token generators.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>What are the campus Wi-Fi security protocols?</AccordionTrigger>
                    <AccordionContent>
                      We utilize WPA2 Enterprise authentication requiring standard student/technician logins.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- DATA TABLE & LOADERS --- */}
        <TabsContent value="data" className="space-y-6">
          {/* Skeletons & Spinner */}
          <div className="grid gap-6 grid-cols-3">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Skeleton Loaders</CardTitle>
                <CardDescription>Pulsing loading placeholders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <div className="flex items-center space-x-4 mt-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Loading Spinner</CardTitle>
                <CardDescription>SVG spinners for async activities.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <span className="text-xs text-muted-foreground font-semibold">
                  Sizes: SM (16px), MD (24px), LG (32px)
                </span>
              </CardContent>
            </Card>
          </div>

          {/* DataTable */}
          <Card>
            <CardHeader>
              <CardTitle>TanStack DataTable Showcase</CardTitle>
              <CardDescription>
                Renders sample data dynamically utilizing the columns definition helper.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={sampleData}
                pageCount={3}
                pageIndex={1}
                onPageChange={(page) => toast.info(`Navigated to page: ${page}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default Playground;
