import { BeforeSidebar } from './before';

/** Opened as `/?sidebar`: the page skips the playground and shows the sidebar on its own. */
export const isSidebarStandalone = () => new URLSearchParams(window.location.search).has('sidebar');

/**
 * The sidebar on a plain page of its own, presented like a specimen: centred, in a rounded
 * frame at a fixed height. The frame belongs to the page, not to the sidebar being fixed.
 */
export const SidebarStandalone = () => (
    // The scope class only brings Tailwind's reset and spacing scale; every colour, size and
    // corner in the sidebar is written out, so none of Continuum's look comes through.
    <div className="continuum flex min-h-screen items-center justify-center bg-[#F4F4F5] p-10">
        <div className="flex h-180 overflow-hidden rounded-[16px] border border-[#E4E4E7] shadow-[0_1px_2px_#0000000D]">
            <BeforeSidebar />
        </div>
    </div>
);
