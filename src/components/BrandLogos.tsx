import sda from "@/assets/sda-logo.png.asset.json";
import pcm from "@/assets/pcm-logo.png.asset.json";

export function BrandLogos({ large = false }: { large?: boolean }) {
  return <div className={`flex shrink-0 items-center ${large ? "gap-6" : "gap-2"}`}>
    <img src={sda.url} alt="Seventh-day Adventist" className={large ? "h-20 w-20 object-contain" : "h-10 w-10 object-contain"} />
    <span className="h-8 w-px bg-glass-border" />
    <img src={pcm.url} alt="Public Campus Ministries" className={large ? "h-24 w-24 object-contain" : "h-11 w-11 object-contain"} />
  </div>;
}