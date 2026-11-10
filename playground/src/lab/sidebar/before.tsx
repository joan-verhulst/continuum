import {
    CalendarDays,
    ChartLine,
    Folder,
    Inbox,
    LayoutDashboard,
    Plus,
    Settings,
} from 'lucide-react';

/**
 * A sidebar built like Continuum's, with the same rows, groups and account footer, but off
 * in the numbers: rows too tall and loose, type a size too big, icons and avatar too
 * large, and colours and a font that are just wrong: a slate-tinted sidebar, a teal active row,
 * an orange badge, muddy greys and Trebuchet MS. Fixing it is only
 * spacing, type sizes, sizes and colour.
 */
export const BeforeSidebar = () => (
    <aside className="flex w-64 shrink-0 flex-col bg-[#FAFAFA] font-['Geist_Variable',sans-serif] antialiased">
        <div className="flex h-14 shrink-0 items-center gap-3 px-4">
            <span className="grid size-6.5 shrink-0 place-items-center rounded-[6px] bg-[#0A0A0A] font-[600] text-[#FFFFFF] text-[13px]/4.5">
                N
            </span>
            <span className="font-[500] text-[#171717] text-[14px]/5">Northwind</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 pt-2">
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] bg-[#EDEDED] px-2.5 text-left"
                type="button"
            >
                <LayoutDashboard color="#171717" size={16} strokeWidth={2} />
                <span className="text-[#171717] text-[13px]/4.5">Dashboard</span>
            </button>
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] px-2.5 text-left"
                type="button"
            >
                <Folder color="#737373" size={16} strokeWidth={2} />
                <span className="text-[#171717] text-[13px]/4.5">Projects</span>
            </button>
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] px-2.5 text-left"
                type="button"
            >
                <Inbox color="#737373" size={16} strokeWidth={2} />
                <span className="grow text-[#171717] text-[13px]/4.5">Inbox</span>
                <span className="rounded-[6px] bg-[#E5E5E5] px-2 py-0.5 text-[#525252] text-[12px]/4">
                    12
                </span>
            </button>
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] px-2.5 text-left"
                type="button"
            >
                <CalendarDays color="#737373" size={16} strokeWidth={2} />
                <span className="text-[#171717] text-[13px]/4.5">Calendar</span>
            </button>
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] px-2.5 text-left"
                type="button"
            >
                <ChartLine color="#737373" size={16} strokeWidth={2} />
                <span className="text-[#171717] text-[13px]/4.5">Reports</span>
            </button>
        </nav>

        <div className="flex flex-col gap-0.5 px-2 pt-6">
            <div className="flex items-center justify-between px-2.5 pb-1">
                <span className="text-[#8F8F8F] text-[12px]/4">Teams</span>
                <Plus color="#8F8F8F" size={16} strokeWidth={2} />
            </div>
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] px-2.5 text-left"
                type="button"
            >
                <span className="grid size-4 shrink-0 place-items-center">
                    <span className="size-2 rounded-full bg-[#A855F7]" />
                </span>
                <span className="text-[#171717] text-[13px]/4.5">Design</span>
            </button>
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] px-2.5 text-left"
                type="button"
            >
                <span className="grid size-4 shrink-0 place-items-center">
                    <span className="size-2 rounded-full bg-[#10B981]" />
                </span>
                <span className="text-[#171717] text-[13px]/4.5">Engineering</span>
            </button>
            <button
                className="flex h-7.5 items-center gap-2 rounded-[10px] px-2.5 text-left"
                type="button"
            >
                <span className="grid size-4 shrink-0 place-items-center">
                    <span className="size-2 rounded-full bg-[#F59E0B]" />
                </span>
                <span className="text-[#171717] text-[13px]/4.5">Marketing</span>
            </button>
        </div>

        <div className="mt-auto flex items-center gap-2.5 px-4.5 pt-4 pb-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-[#E5E5E5] font-[600] text-[#171717] text-[12px]/4">
                JV
            </span>
            <span className="flex min-w-0 grow flex-col">
                <span className="truncate font-[500] text-[#171717] text-[13px]/4.5">
                    Joan Verhulst
                </span>
                <span className="truncate text-[#8F8F8F] text-[12px]/4">joan@northwind.io</span>
            </span>
            <Settings className="shrink-0" color="#737373" size={16} strokeWidth={2} />
        </div>
    </aside>
);
