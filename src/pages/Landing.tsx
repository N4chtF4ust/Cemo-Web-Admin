import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Chart02Icon,
  CloudIcon,
  Leaf01Icon,
} from "@hugeicons/core-free-icons";
import appIconSrc from "~/assets/icon.png";
import bannerSrc from "~/assets/banner.jpeg";

const highlights = [
  {
    icon: Chart02Icon,
    title: "Live weight monitoring",
    description: "Measure food waste weight from connected IoT bins as it is collected.",
  },
  {
    icon: CloudIcon,
    title: "Waste records",
    description: "Store reliable weight readings to understand how much food waste is produced.",
  },
  {
    icon: Leaf01Icon,
    title: "Food waste data analytics",
    description: " gain insights into food waste analytics tools.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#061612] text-white selection:bg-cemo-primary/30">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-cemo-primary/30 bg-cemo-primary/10">
            <img src={appIconSrc} alt="CEMO" className="size-7 object-contain" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">CEMO</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cemo-primary">Food Waste IoT</p>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pb-24 lg:pt-14">
        <div className="pointer-events-none absolute -left-32 top-0 size-96 rounded-full bg-cemo-primary/15 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 size-[32rem] rounded-full bg-emerald-500/10 blur-[130px]" />

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <img
            src={bannerSrc}
            alt="CEMO Monitor smart waste analytics"
            className="h-[clamp(22rem,58vw,42rem)] w-full object-cover object-center"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 sm:grid-cols-3 sm:px-8 lg:px-10 lg:pb-24">
        {highlights.map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-cemo-primary/10 text-cemo-primary">
              <HugeiconsIcon icon={item.icon} className="size-5" />
            </div>
            <h2 className="font-bold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">{item.description}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-white/10 px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CEMO Monitor</span>
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-cemo-primary" />
            Connected sustainability intelligence
          </span>
        </div>
      </footer>
    </main>
  );
}

export { Landing };
export default Landing;
