# Graph Report - .  (2026-07-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1292 nodes · 1923 edges · 147 communities (82 shown, 65 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a4ae3da`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141

## God Nodes (most connected - your core abstractions)
1. `cn()` - 140 edges
2. `customFetch()` - 31 edges
3. `compilerOptions` - 23 edges
4. `useToast()` - 20 edges
5. `CustomersPage()` - 12 edges
6. `useAuth()` - 11 edges
7. `compilerOptions` - 11 edges
8. `withQueryKey()` - 10 edges
9. `db` - 10 edges
10. `requireAuth()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `CustomersPage()` --calls--> `useDeleteCustomer()`  [EXTRACTED]
  artifacts/nadraan/src/pages/customers.tsx → lib/api-client-react/src/generated/api.ts
- `CustomersPage()` --calls--> `useListCustomers()`  [EXTRACTED]
  artifacts/nadraan/src/pages/customers.tsx → lib/api-client-react/src/generated/api.ts
- `NewOrderPage()` --calls--> `useListCustomers()`  [EXTRACTED]
  artifacts/nadraan/src/pages/new-order.tsx → lib/api-client-react/src/generated/api.ts
- `ProductsPage()` --calls--> `useListProducts()`  [EXTRACTED]
  artifacts/nadraan/src/pages/products.tsx → lib/api-client-react/src/generated/api.ts
- `ProfilePage()` --calls--> `useListOrders()`  [EXTRACTED]
  artifacts/nadraan/src/pages/profile.tsx → lib/api-client-react/src/generated/api.ts

## Import Cycles
- None detected.

## Communities (147 total, 65 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (61): Awaited, AwaitedInput, CreateCustomerMutationBody, CreateCustomerMutationError, CreateCustomerMutationResult, CreateOrderMutationBody, CreateOrderMutationError, CreateOrderMutationResult (+53 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (43): Kbd(), KbdGroup(), ResizableHandle(), ResizablePanelGroup(), SheetContent, SheetContentProps, SheetDescription, SheetFooter() (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (22): AuthResponse, Customer, CustomerInput, CustomerUpdate, DashboardSummary, ErrorResponse, HealthStatus, HealthStatusStatus (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (23): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Badge(), BadgeProps (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (26): ApiError, applyBaseUrl(), AuthTokenGetter, BodyType, buildErrorMessage(), CustomFetchOptions, ErrorType, getMediaType() (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (26): CartItem, n(), NewOrderPage(), getCreateOrderMutationOptions(), AuthResponse, Customer, CustomerInput, CustomerUpdate (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, incremental, jsx, lib, moduleResolution, noEmit, paths (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (25): drizzle-kit, drizzle-zod, dependencies, drizzle-orm, drizzle-zod, pg, zod, devDependencies (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (25): CreateCustomerResponse, CreateOrderResponse, CreateProductResponse, CreateUserResponse, DeleteCustomerResponse, DeleteProductResponse, DeleteUserResponse, GetDashboardSummaryResponse (+17 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (25): workspace, compilerOptions, alwaysStrict, customConditions, incremental, isolatedModules, lib, module (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (21): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (20): ADMIN_ROLES, EMPTY, formatDate(), ROLE_COLOR, ROLES, UsersPage(), deleteUser(), getCreateUserMutationOptions() (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (15): exportCSV(), todayStr(), AVATAR_COLORS, avatarColor(), CustomersPage(), EMPTY, formatDate(), initials() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (17): EMPTY, inp(), n(), ProductsPage(), SortDir, SortKey, StockBadge(), createProduct() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (21): dependencies, bcryptjs, cookie-parser, cors, drizzle-orm, express, jsonwebtoken, pino (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (17): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Item(), ItemActions(), ItemContent(), ItemDescription() (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (20): customFetch(), isRequest(), mergeHeaders(), resolveMethod(), createCustomer(), createOrder(), createUser(), deleteProduct() (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (19): devDependencies, esbuild, esbuild-plugin-pino, pino-pretty, @types/bcryptjs, @types/cookie-parser, @types/express, @types/jsonwebtoken (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (15): DashboardPage(), n(), STATUS_STYLE, getGetMeQueryKey(), getGetMeQueryOptions(), getGetMeUrl(), getGetSalesChartQueryKey(), getGetSalesChartQueryOptions() (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs, @workspace/db, devDependencies, tsx, @types/node, bcryptjs, @types/node (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (13): Customer, InsertCustomer, insertCustomerSchema, InsertOrder, insertOrderSchema, Order, InsertProduct, insertProductSchema (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (11): signToken(), cleanup(), createTestCustomer(), createTestProduct(), createTestUser(), tokenFor(), db, pool (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (15): devDependencies, prettier, typescript, license, name, private, scripts, build (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (10): router, router, router, router, CreateProductBody, DeleteProductParams, HealthCheckResponse, LoginBody (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (15): devDependencies, class-variance-authority, date-fns, @radix-ui/react-label, @radix-ui/react-progress, @radix-ui/react-separator, @radix-ui/react-switch, tailwind-merge (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (14): background_color, categories, description, dir, display, icons, lang, name (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): Field(), FieldContent(), FieldDescription(), FieldError(), FieldGroup(), FieldLabel(), FieldLegend(), FieldSeparator() (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (14): ToastActionElement, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.20
Nodes (12): formatDate(), n(), OrdersPage(), SortDir, SortKey, STATUS_STYLE, STATUSES, getListOrdersQueryKey() (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declarationMap, emitDeclarationOnly, lib, outDir, rootDir, extends (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (12): compilerOptions, incremental, outDir, rootDir, tsBuildInfoFile, types, extends, include (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (7): ProtectedRoute(), queryClient, NAV_GROUPS, Sidebar(), Toaster(), useAuth(), NotFoundPage()

### Community 36 - "Community 36"
Cohesion: 0.21
Nodes (10): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea() (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.27
Nodes (10): AuthUser, clearAuth(), AuthContext, AuthContextType, AuthProvider(), getToken(), getUser(), isAuthenticated() (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (12): compilerOptions, composite, declarationMap, emitDeclarationOnly, outDir, rootDir, types, extends (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (7): app, req(), res(), port, logger, asyncHandler(), router

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (11): dependencies, @tanstack/react-query, exports, react, @tanstack/react-query, name, peerDependencies, react (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, declarationMap, emitDeclarationOnly, outDir, rootDir, extends, include (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.27
Nodes (8): JwtPayload, requireAuth(), verifyToken(), router, CreateCustomerBody, DeleteCustomerParams, UpdateCustomerBody, UpdateCustomerParams

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (8): addClient(), AppNotification, broadcast(), clients, getHistory(), history, removeClient(), router

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, serve, typecheck, type (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.31
Nodes (8): Toast, ToastAction, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants, ToastViewport

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (9): compilerOptions, outDir, rootDir, types, extends, include, node, src (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (7): AppNotification, NotificationBell(), timeAgo(), TYPE_ICON, useToast(), LoginPage(), useLogin()

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (8): devDependencies, orval, name, private, scripts, codegen, version, orval

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): dependencies, zod, exports, zod, name, private, type, version

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): requireRole(), ADMIN_ROLES, router, CreateUserBody, DeleteUserParams, UpdateUserBody, UpdateUserParams

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 60 - "Community 60"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 61 - "Community 61"
Cohesion: 0.32
Nodes (5): formatDate(), n(), ProfilePage(), STATUS_STYLE, Order

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (7): scripts, build, dev, start, test, test:watch, typecheck

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (5): router, CreateOrderBody, GetOrderParams, UpdateOrderBody, UpdateOrderParams

### Community 64 - "Community 64"
Cohesion: 0.38
Nodes (5): AppLayout(), PAGE_TITLES, useIsMobile(), MobileBottomNav(), NAV

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (5): compileOnSave, extends, files, ./tsconfig.base.json, references

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 71 - "Community 71"
Cohesion: 0.40
Nodes (5): getGetOrderQueryKey(), getGetOrderQueryOptions(), getGetOrderUrl(), getOrder(), useGetOrder()

### Community 72 - "Community 72"
Cohesion: 0.40
Nodes (5): getHealthCheckQueryKey(), getHealthCheckQueryOptions(), getHealthCheckUrl(), healthCheck(), useHealthCheck()

### Community 73 - "Community 73"
Cohesion: 0.40
Nodes (5): getListCustomersQueryKey(), getListCustomersQueryOptions(), getListCustomersUrl(), listCustomers(), useListCustomers()

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (3): apiClientReactSrc, apiZodSrc, root

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (4): getDashboardSummary(), getGetDashboardSummaryQueryKey(), getGetDashboardSummaryQueryOptions(), getGetDashboardSummaryUrl()

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (4): getListProductsQueryKey(), getListProductsQueryOptions(), getListProductsUrl(), listProducts()

## Knowledge Gaps
- **578 isolated node(s):** `artifactDir`, `name`, `version`, `private`, `type` (+573 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 1` to `Community 3`, `Community 10`, `Community 15`, `Community 23`, `Community 24`, `Community 29`, `Community 31`, `Community 35`, `Community 36`, `Community 40`, `Community 42`, `Community 47`, `Community 48`, `Community 49`, `Community 52`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 65`, `Community 66`, `Community 69`, `Community 70`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 35` to `Community 61`, `Community 11`, `Community 51`, `Community 37`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 27` to `Community 128`, `Community 129`, `Community 130`, `Community 131`, `Community 132`, `Community 133`, `Community 134`, `Community 135`, `Community 136`, `Community 137`, `Community 138`, `Community 46`, `Community 83`, `Community 84`, `Community 85`, `Community 86`, `Community 87`, `Community 88`, `Community 89`, `Community 90`, `Community 91`, `Community 92`, `Community 93`, `Community 94`, `Community 95`, `Community 96`, `Community 97`, `Community 98`, `Community 99`, `Community 100`, `Community 101`, `Community 102`, `Community 103`, `Community 104`, `Community 105`, `Community 106`, `Community 107`, `Community 108`, `Community 109`, `Community 110`, `Community 111`, `Community 112`, `Community 113`, `Community 114`, `Community 115`, `Community 116`, `Community 117`, `Community 118`, `Community 119`, `Community 120`, `Community 121`, `Community 122`, `Community 123`, `Community 124`, `Community 125`, `Community 126`, `Community 127`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `artifactDir`, `name`, `version` to the rest of the system?**
  _578 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.034902168164992066 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07755102040816327 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06565656565656566 - nodes in this community are weakly interconnected._