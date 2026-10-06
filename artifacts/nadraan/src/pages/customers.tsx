import { useState } from "react";
import {
  useListCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import type { Customer } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCustomerBody } from "@workspace/api-zod";
import * as z from "zod";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("fa-IR");
  } catch {
    return d;
  }
}
function initials(name: string) {
  return name.trim()[0] ?? "؟";
}

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-purple-500/20 text-purple-400",
  "bg-orange-500/20 text-orange-400",
  "bg-rose-500/20 text-rose-400",
];
function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

type CustomerFormValues = z.infer<typeof CreateCustomerBody>;

export default function CustomersPage() {
  const { data: raw, isLoading } = useListCustomers();
  const qc = useQueryClient();
  const { toast } = useToast();

  const customers: Customer[] = Array.isArray(raw) ? raw : [];
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.includes(search) ||
      (c.phone && c.phone.includes(search)) ||
      (c.code && c.code.includes(search)),
  );

  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const del = useDeleteCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CreateCustomerBody),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", phone: "", address: "" });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    form.reset({
      name: c.name,
      phone: c.phone,
      address: c.address || "",
    });
    setModalOpen(true);
  }

  function onSubmit(values: CustomerFormValues) {
    if (editing) {
      update.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["listCustomers"] });
            toast({
              title: "مشتری ویرایش شد",
              description: "اطلاعات مشتری با موفقیت به‌روزرسانی شد.",
            });
            setModalOpen(false);
          },
          onError: () => {
            toast({
              title: "خطا در ویرایش",
              description: "مشکلی در ویرایش مشتری به وجود آمد.",
              variant: "destructive",
            });
          },
        },
      );
    } else {
      create.mutate(
        { data: values },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["listCustomers"] });
            toast({
              title: "مشتری اضافه شد",
              description: "مشتری جدید با موفقیت ثبت شد.",
            });
            setModalOpen(false);
          },
          onError: () => {
            toast({
              title: "خطا در ثبت",
              description: "مشکلی در ثبت مشتری به وجود آمد.",
              variant: "destructive",
            });
          },
        },
      );
    }
  }

  function confirmDelete() {
    if (deleteId === null) return;
    del.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["listCustomers"] });
          toast({
            title: "مشتری حذف شد",
            description: "مشتری با موفقیت از سیستم حذف شد.",
          });
          setDeleteId(null);
        },
        onError: () => {
          toast({
            title: "خطا در حذف",
            description: "مشکلی در حذف مشتری به وجود آمد.",
            variant: "destructive",
          });
          setDeleteId(null);
        },
      },
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">مشتریان</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت مشتریان، فروشگاه‌ها و اطلاعات تماس
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus size={16} className="ml-2" />
            مشتری جدید
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در نام، شماره یا کد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length.toLocaleString("fa-IR")} مشتری
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[300px]">مشتری</TableHead>
              <TableHead>شماره تماس</TableHead>
              <TableHead>آدرس</TableHead>
              <TableHead>تاریخ ثبت</TableHead>
              <TableHead className="w-24 text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Users size={40} className="opacity-20" />
                    <span className="text-sm">
                      {search ? "مشتری‌ای یافت نشد" : "هنوز مشتری‌ای ثبت نشده"}
                    </span>
                    {!search && (
                      <Button
                        variant="link"
                        onClick={openCreate}
                        className="h-auto p-0 text-sm"
                      >
                        اولین مشتری را اضافه کنید &larr;
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${avatarColor(
                          c.name,
                        )}`}
                      >
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm whitespace-nowrap">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {c.code}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm whitespace-nowrap" dir="ltr">
                      {c.phone || (
                        <span className="text-muted-foreground/40">
                          &mdash;
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground max-w-[250px] truncate">
                      {c.address || <span className="opacity-40">&mdash;</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(c.createdAt ?? "")}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-1 justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => openEdit(c)}
                        aria-label="ویرایش"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(c.id)}
                        aria-label="حذف"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={modalOpen} onOpenChange={setModalOpen}>
        <SheetContent
          side="left"
          className="sm:max-w-md w-full overflow-y-auto p-0"
        >
          <div className="p-6 h-full flex flex-col">
            <SheetHeader className="mb-6">
              <SheetTitle>{editing ? "ویرایش مشتری" : "مشتری جدید"}</SheetTitle>
              <SheetDescription>
                اطلاعات مشتری را در فرم زیر وارد کنید.
              </SheetDescription>
            </SheetHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 flex-1"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام فروشگاه / شخص *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثلاً: فروشگاه رضایی" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره تماس (تلفن همراه) *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="09xxxxxxxxx"
                          dir="ltr"
                          inputMode="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>آدرس</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="آدرس کامل فروشگاه"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter className="mt-8 pt-4 border-t sticky bottom-0 bg-background">
                  <div className="flex gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-1/2"
                      onClick={() => setModalOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      className="w-1/2"
                      disabled={create.isPending || update.isPending}
                    >
                      {create.isPending || update.isPending
                        ? "در حال ذخیره..."
                        : "ذخیره اطلاعات"}
                    </Button>
                  </div>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مشتری</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این مشتری اطمینان دارید؟ این عمل غیرقابل بازگشت است و
              ممکن است روی سفارشات مرتبط تاثیر بگذارد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={del.isPending}
            >
              {del.isPending ? "در حال حذف..." : "حذف مشتری"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
