import type { Route } from "./+types/results";
import {
  Link,
  redirect,
  useLoaderData,
  useNavigate,
} from "react-router";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type FormEvent,
  type SVGProps,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Anchor,
  ArrowLeft,
  Loader2,
  MapPin,
  Search as SearchIcon,
} from "lucide-react";
import { copyWithToast } from "~/lib/copy";

type Port = {
  locode: string;
  name: string;
  countryCode: string;
  countryName: string;
};

type CountryLite = { code: string; name: string };

type SearchPayload = {
  countries: CountryLite[];
  ports: Port[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) {
    throw redirect("/");
  }
  const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";
  const api = new URL("/api/search", backendBase);
  api.searchParams.set("q", q);

  let res: Response;
  try {
    res = await fetch(api);
  } catch (error) {
    console.error("Backend request failed", error);
    throw new Response("Backend unavailable", { status: 502 });
  }

  if (!res.ok) {
    throw new Response("Failed to load search results", {
      status: res.status,
      statusText: res.statusText,
    });
  }

  const data = (await res.json()) as SearchPayload;
  return { q, initial: data, backendBase };
}

export function meta({ data }: Route.MetaArgs) {
  if (data && "q" in data && data.q) {
    return [
      { title: `${data.q} - UN/LOCODE 查询结果` },
      {
        name: "description",
        content: `UN/LOCODE 查询：${data.q} 的国家和港口匹配结果。`,
      },
    ];
  }

  return [
    { title: "搜索结果 - UN/LOCODE Explorer" },
    {
      name: "description",
      content: "查看 UN/LOCODE 查询结果。",
    },
  ];
}

export default function Results() {
  const { q, initial, backendBase } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState(() => q);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const queryIsEmpty = query.trim().length === 0;

  const {
    data = initial,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["search", query, backendBase],
    queryFn: async () => {
      const target = new URL("/api/search", backendBase);
      if (query.trim()) {
        target.searchParams.set("q", query);
      }
      const res = await fetch(target);
      if (!res.ok) throw new Error("Failed to load");
      return (await res.json()) as SearchPayload;
    },
    initialData: query === q ? initial : undefined,
    enabled: !queryIsEmpty,
  });

  const countryResults = data?.countries ?? [];
  const portResults = data?.ports ?? [];
  const hasResults = countryResults.length > 0 || portResults.length > 0;

  const handleCountrySelect = useCallback(
    (country: CountryLite) => {
      navigate(`/countries/${encodeURIComponent(country.code)}`);
    },
    [navigate],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = query.trim();
    if (!next) return;
    if (next === q) {
      void refetch();
      return;
    }
    navigate(`/results?q=${encodeURIComponent(next)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12 md:px-8">
        <header className="border-b border-border/70 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> 返回首页
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                搜索 “{q}”
              </h1>
              <p className="text-sm text-muted-foreground">
                显示来自 UN/LOCODE 的国家与港口记录。
              </p>
            </div>
            {isFetching ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> 正在更新
              </span>
            ) : null}
          </div>

          <form
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-lg shadow-black/5 backdrop-blur md:flex-row md:items-center"
            onSubmit={handleSubmit}
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="重新搜索国家、城市或 UN/LOCODE"
                className="h-12 rounded-2xl border-0 bg-muted/60 pl-10 text-base shadow-inner focus-visible:rounded-2xl focus-visible:border-ring/60"
                aria-label="重新搜索 UN/LOCODE"
              />
            </div>
            <Button type="submit" className="h-12 rounded-2xl px-5 text-base">
              搜索
            </Button>
          </form>
        </header>

        <main className="mt-10">
          {hasResults ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)] lg:items-start">
              <section className="space-y-4">
                <SectionHeader
                  title="港口 / 地点"
                  count={portResults.length}
                  description="按相关度排序，最多展示 200 条记录"
                  icon={Anchor}
                />
                {portResults.length > 0 ? (
                  <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60">
                    {portResults.map((port, index) => (
                      <PortRow key={`${port.locode}-${index}`} port={port} />
                    ))}
                  </div>
                ) : (
                  <EmptyList message="没有匹配的港口，可尝试输入港口名称或 LOCODE。" />
                )}
              </section>

              <aside className="space-y-4">
                <SectionHeader
                  title="匹配国家"
                  count={countryResults.length}
                  description="最多显示前 10 条国家记录"
                  icon={MapPin}
                />
                {countryResults.length > 0 ? (
                  <div className="space-y-4">
                    {countryResults.map((country) => (
                      <CountryCard
                        key={country.code}
                        country={country}
                        onSelect={handleCountrySelect}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyList message="没有匹配的国家，可尝试修改关键字。" />
                )}
              </aside>
            </div>
          ) : (
            <NoResultsCard query={q} />
          )}
        </main>
      </div>
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  count: number;
  description: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

function SectionHeader({ title, count, description, icon: Icon }: SectionHeaderProps) {
  return (
    <header className="flex flex-col gap-2 border-b border-border/60 pb-2">
      <div className="flex items-baseline gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
          <span>{title}</span>
        </h2>
        <span className="text-sm text-muted-foreground">约 {count} 条结果</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </header>
  );
}

type CountryCardProps = {
  country: CountryLite;
  onSelect?: (country: CountryLite) => void;
};

function CountryCard({ country, onSelect }: CountryCardProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.(country);
      }}
      className="w-full cursor-pointer rounded-2xl border border-border/70 bg-card/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`查看 ${country.name} 的详细港口列表`}
    >
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
          {country.code}
        </span>
        <h3 className="text-lg font-medium text-foreground">{country.name}</h3>
      </div>
    </button>
  );
}

type PortRowProps = {
  port: Port;
};

function PortRow({ port }: PortRowProps) {
  return (
    <button
      type="button"
      onClick={() => {
        void copyWithToast(port.locode, "LOCODE");
      }}
      className="flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`复制 ${port.name} 的 LOCODE ${port.locode}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground">{port.name}</h3>
          <p className="text-xs text-muted-foreground">
            {port.countryName} · {port.countryCode}
          </p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          {port.locode}
        </span>
      </div>
    </button>
  );
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function NoResultsCard({ query }: { query: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/80 bg-card/70 p-10 text-center">
      <p className="text-lg font-semibold text-foreground">没有找到与 “{query}” 相关的结果</p>
      <p className="mt-2 text-sm text-muted-foreground">
        尝试缩短关键词、仅输入国家/城市名称，或返回首页重新发起搜索。
      </p>
    </div>
  );
}
