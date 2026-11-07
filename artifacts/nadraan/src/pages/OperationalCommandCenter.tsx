import { useState } from "react";
import { Search, Mic, MapPin, Phone, MoreHorizontal, ChevronLeft, Bell, Settings, Filter, ArrowUpRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// MOCK DATA
const priorityLeads = [
  {
    id: "1",
    name: "فروشگاه مواد غذایی برادران حسینی",
    address: "تهران، بازار بزرگ، سرای امید",
    status: "آماده سفارش",
    statusColor: "bg-emerald-500/10 text-emerald-500",
    statusIcon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    lastVisit: "دو روز پیش",
    probability: 85,
    amount: "۴۵,۰۰۰,۰۰۰",
  },
  {
    id: "2",
    name: "سوپرمارکت یاران",
    address: "کرج، مهرشهر، بلوار ارم",
    status: "در حال ارزیابی",
    statusColor: "bg-amber-500/10 text-amber-500",
    statusIcon: <Clock className="w-3.5 h-3.5 mr-1" />,
    lastVisit: "هفته گذشته",
    probability: 45,
    amount: "۱۲,۵۰۰,۰۰۰",
  },
  {
    id: "3",
    name: "هایپرمارکت ستاره شهر",
    address: "تهران، پاسداران، خیابان گلستان",
    status: "نیاز به پیگیری",
    statusColor: "bg-rose-500/10 text-rose-500",
    statusIcon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
    lastVisit: "سه هفته پیش",
    probability: 20,
    amount: "۸۵,۰۰۰,۰۰۰",
  }
];

const suggestedActions = [
  {
    title: "تماس با فروشگاه برادران حسینی",
    description: "پیگیری پیش‌فاکتور ارسال شده در روز یکشنبه",
    type: "call",
    time: "امروز، ۱۱:۳۰"
  },
  {
    title: "ثبت سفارش سوپرمارکت یاران",
    description: "موجودی انبار تایید شده، منتظر ثبت نهایی",
    type: "order",
    time: "فردا، ۱۰:۰۰"
  }
];

export default function OperationalCommandCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-48px)]">

      {/* ── Main Priority Feed ── */}
      <div className="flex-1 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مرکز فرماندهی فروش</h1>
            <p className="text-muted-foreground mt-1 text-sm">شما ۳ وظیفه مهم برای امروز دارید.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="جستجوی مشتری یا شماره سفارش..."
                className="pl-8 pr-9 bg-card border-none shadow-sm focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 bg-card border-none shadow-sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
            همه موارد
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary hover:bg-primary/20 rounded-full px-1.5 min-w-[20px] justify-center">۱۲</Badge>
          </Button>
          <Button variant="ghost" className="rounded-full text-muted-foreground hover:bg-card shrink-0">
            آماده سفارش
            <Badge variant="outline" className="ml-2 rounded-full px-1.5 min-w-[20px] justify-center">۵</Badge>
          </Button>
          <Button variant="ghost" className="rounded-full text-muted-foreground hover:bg-card shrink-0">
            نیاز به پیگیری
            <Badge variant="outline" className="ml-2 rounded-full px-1.5 min-w-[20px] justify-center">۳</Badge>
          </Button>
        </div>

        {/* Lead Cards List */}
        <div className="space-y-4">
          {priorityLeads.map((lead) => (
            <Card key={lead.id} className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between sm:justify-start sm:gap-4">
                  <h3 className="font-semibold text-base sm:text-lg">{lead.name}</h3>
                  <Badge variant="outline" className={`border-none ${lead.statusColor} shrink-0`}>
                    {lead.statusIcon}
                    {lead.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 opacity-70" />
                    {lead.address}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 opacity-70" />
                    آخرین ویزیت: {lead.lastVisit}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 border-t sm:border-t-0 sm:border-r border-border pt-4 sm:pt-0 sm:pr-6 mt-2 sm:mt-0">
                <div className="text-left sm:text-right">
                  <div className="text-xs text-muted-foreground mb-1">ارزش تخمینی</div>
                  <div className="font-bold text-lg text-primary">{lead.amount} <span className="text-xs font-normal text-muted-foreground">تومان</span></div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 pr-3">
                    ثبت سفارش
                    <ChevronLeft className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Right Assistant Panel (RTL so it appears on left visually if space allows, but wait, standard is right-side panel means flex-row will put it on left in RTL if not re-ordered. Wait, 'flex-row' in RTL puts first item on RIGHT. So the main feed is on the right, panel on left. Let's keep it. The prompt says "Right Assistant Panel". In RTL, right is the start of the layout. So we might need to adjust order if it should be on the right. Let's make it the start of the flex container or use flex-row-reverse depending on visual.) */}

      {/* Assuming standard RTL layout: First element (Main Feed) is on the Right. Second element (Panel) is on the Left.
          If we want the Panel on the Right, it should be the first element in the flex container. Let's make it appear on the left as a sidebar usually would in RTL if the main content is right, or vice-versa. The prompt says "Right Assistant Panel". In LTR that's end. In RTL, "Right" is "Start". Let's place it first in the DOM if we want it on the right, or just use flex-row-reverse. I'll put it first to be on the Right. Wait, main feed is 65%, panel 35%. I will put the Assistant Panel second in DOM so it's on the LEFT in RTL. Usually in RTL dashboards, primary content is on the right, side panels on the left. Let's stick to standard RTL flow (main feed first -> right, panel second -> left). */}

      <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">

        {/* Assistant Card */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">دستیار هوشمند</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary font-normal">
                آنلاین
              </Badge>
            </div>

            {/* Probability Gauge / Score */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Simple CSS Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" className="stroke-muted fill-none" strokeWidth="8" />
                  <circle cx="64" cy="64" r="56" className="stroke-primary fill-none" strokeWidth="8" strokeDasharray="351" strokeDashoffset="87" strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">۷۵٪</span>
                  <span className="text-xs text-muted-foreground mt-1">احتمال موفقیت</span>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground mt-4 leading-relaxed">
                بر اساس الگوی خرید مشتریان، احتمال تحقق هدف فروش این هفته <strong className="text-foreground">بالا</strong> است.
              </p>
            </div>

            {/* Voice Input Trigger */}
            <div className="mt-6">
              <Button className="w-full h-14 rounded-xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow bg-primary text-primary-foreground relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <Mic className="w-5 h-5 ml-2 relative z-10" />
                <span className="relative z-10">ثبت صوتی خلاصه ویزیت</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Suggested Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground px-1">اقدامات پیشنهادی</h3>

          <div className="space-y-3">
            {suggestedActions.map((action, idx) => (
              <Card key={idx} className="p-4 hover:bg-card/80 transition-colors cursor-pointer">
                <div className="flex gap-3">
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${action.type === 'call' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {action.type === 'call' ? <Phone className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-sm leading-tight">{action.title}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary">
                      <Clock className="w-3.5 h-3.5" />
                      {action.time}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground self-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
