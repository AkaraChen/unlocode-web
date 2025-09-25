import type { Route } from "./+types/home";
import { useLoaderData, useNavigate } from "react-router";
import { useState, useEffect, type ComponentType, type SVGProps } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Globe2,
  RefreshCw,
  Search as SearchIcon,
  ShieldCheck,
} from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  return { q };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UN/LOCODE Explorer" },
    {
      name: "description",
      content: "一个针对 UN/LOCODE 的快速查询入口，实时掌握全球港口与国家代码。",
    },
  ];
}

export default function Home() {
  const { q } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState(() => q ?? "");
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(q ?? "");
  }, [q]);

  const examples = ["Rotterdam", "Singapore", "New York"];

  const highlights: Array<{
    title: string;
    description: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
  }> = [
    {
      title: "每日自动更新",
      description: "自建爬虫每日刷新 UNECE 发布的数据，确保搜索结果保持新鲜。",
      icon: RefreshCw,
    },
    {
      title: "权威数据来源",
      description: "数据直接来自联合国欧洲经济委员会 (UNECE) 官方 UN/LOCODE 代码表。",
      icon: ShieldCheck,
    },
    {
      title: "全球全量覆盖",
      description: "收录 10,000+ 个国家与港口地点代码，支持代码、名称多种方式检索。",
      icon: Globe2,
    },
  ];

  function submitSearch(value: string) {
    const next = value.trim();
    if (!next) return;
    navigate(`/results?q=${encodeURIComponent(next)}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-20 pt-12 md:px-8 md:pt-16">
        <header className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/90 px-4 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur">
            <Compass className="size-3" />
            UN/LOCODE Explorer
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              秒级检索全球港口与国家代码。
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
              输入国家、城市或 LOCODE，立即跳转到查询结果。我们每天自动抓取并整理 UNECE 官方数据，助你快速定位全球航运、物流地点信息。
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl shadow-black/5 backdrop-blur">
            <form
              className="flex flex-col gap-4 md:flex-row md:items-center"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch(query);
              }}
            >
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索国家、城市或 UN/LOCODE，例如 SG SIN"
                  className="h-12 rounded-2xl border-0 bg-muted/60 pl-10 text-base shadow-inner focus-visible:rounded-2xl focus-visible:border-ring/60"
                  aria-label="搜索 UN/LOCODE"
                />
                {query.trim() ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => setQuery("")}
                  >
                    清除
                  </Button>
                ) : null}
              </div>
              <Button
                type="submit"
                className="h-12 rounded-2xl px-6 text-base shadow-md"
              >
                前往查询
                <ArrowUpRight className="size-4" />
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">快速示例：</span>
              {examples.map((sample) => (
                <Button
                  key={sample}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-muted/70 bg-transparent px-3 text-xs"
                  onClick={() => submitSearch(sample)}
                >
                  {sample}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <HighlightCard key={item.title} {...item} />
          ))}
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/95 p-8 shadow-xl shadow-black/5 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                为团队打造的查询体验
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                从航运调度到供应链查询，都可以通过一个链接掌握全球港口代码。您可以将结果页直接分享给同事，或在系统中嵌入我们的接口进行二次开发。
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="group rounded-2xl border-muted/70 px-4"
              onClick={() => submitSearch("Shanghai")}
            >
              查看示例结果
              <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-1" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

type HighlightProps = {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function HighlightCard({ title, description, icon: Icon }: HighlightProps) {
  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-transparent bg-muted/40 p-6 shadow-inner">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </article>
  );
}
