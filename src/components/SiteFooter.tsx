import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/hcmusec",
    icon: <FacebookIcon />
  },
  {
    label: "Discord",
    href: "https://discord.com/invite/Ztkk8csTck",
    icon: <DiscordIcon />
  },
  {
    label: "hcmusec@gmail.com",
    href: "mailto:hcmusec@gmail.com",
    icon: <Mail size={20} aria-hidden />
  }
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#2a2a2a] bg-[#151515] text-[#fffdf8]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-9 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-md bg-white p-1">
            <Image className="size-full object-contain" src="/logoclb.png" alt="USEC logo" width={48} height={48} />
          </span>
          <div>
            <p className="font-black">VNU-HCMUS Esports Club</p>
            <p className="mt-1 text-sm text-white/60">Since 2014. this site wasn't made with love.</p>
          </div>
        </div>
        <nav aria-label="Social and contact links" className="flex flex-wrap gap-3">
          {socialLinks.map((link) => (
            <Link
              key={link.label}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/15 px-3.5 text-sm font-bold transition hover:border-white/40 hover:bg-white/10"
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} USEC. All rights reserved.
      </div>
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.028 4.388 11.023 10.125 11.93v-8.421H7.078v-3.509h3.047V9.399c0-3.043 1.792-4.724 4.533-4.724 1.312 0 2.686.237 2.686.237v2.984H15.83c-1.491 0-1.956.936-1.956 1.896v2.281h3.328l-.532 3.509h-2.796v8.421C19.612 23.096 24 18.101 24 12.073Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M19.5 5.34A17.3 17.3 0 0 0 15.2 4l-.54 1.1a15.7 15.7 0 0 0-5.3 0L8.8 4a17.5 17.5 0 0 0-4.32 1.35C1.75 9.45 1 13.45 1.37 17.4a17.4 17.4 0 0 0 5.28 2.67l1.3-1.78a10.8 10.8 0 0 1-2.02-.98l.5-.39c3.9 1.8 8.13 1.8 11.98 0l.52.4c-.65.38-1.33.7-2.04.97l1.3 1.78a17.3 17.3 0 0 0 5.28-2.67c.43-4.58-.74-8.54-3.97-12.06ZM8.52 14.98c-1.17 0-2.13-1.08-2.13-2.4 0-1.33.94-2.41 2.13-2.41 1.2 0 2.15 1.09 2.13 2.41 0 1.32-.94 2.4-2.13 2.4Zm6.96 0c-1.17 0-2.13-1.08-2.13-2.4 0-1.33.94-2.41 2.13-2.41 1.2 0 2.15 1.09 2.13 2.41 0 1.32-.93 2.4-2.13 2.4Z" />
    </svg>
  );
}
