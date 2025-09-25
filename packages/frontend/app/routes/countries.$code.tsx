import type { Route } from "./+types/countries.$code";
import { redirect, useLoaderData, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Input } from "~/components/ui/input";
import { copyWithToast } from "~/lib/copy";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";

type Port = {
  locode: string;
  name: string;
  countryCode: string;
  countryName: string;
};

type Country = {
  code: string;
  name: string;
};

type LoaderData = {
  country: Country;
  ports: Port[];
};

export async function loader({ params, request }: Route.LoaderArgs): Promise<LoaderData> {
  const code = (params.code ?? "").trim();
  if (!code) {
    throw redirect("/");
  }

  const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";
  const target = new URL(`/api/countries/${encodeURIComponent(code)}`, backendBase);

  let res: Response;
  try {
    res = await fetch(target);
  } catch (error) {
    console.error("Backend request failed", error);
    throw new Response("Backend unavailable", { status: 502 });
  }

  if (res.status === 404) {
    throw new Response("Country not found", { status: 404 });
  }

  if (!res.ok) {
    throw new Response("Failed to load country", {
      status: res.status,
      statusText: res.statusText,
    });
  }

  const data = (await res.json()) as { country: Country; ports: Port[] };
  return data;
}

export function meta({ data }: Route.MetaArgs) {
  if (data) {
    return [
      { title: `${data.country.name} (${data.country.code}) - UN/LOCODE 港口列表` },
      {
        name: "description",
        content: `查看 ${data.country.name} (${data.country.code}) 的所有港口 LOCODE。`,
      },
    ];
  }

  return [
    { title: "国家详情 - UN/LOCODE Explorer" },
    {
      name: "description",
      content: "浏览指定国家的 UN/LOCODE 港口列表。",
    },
  ];
}

export default function CountryDetail() {
  const { country, ports } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setQuery("");
  }, [country.code]);

  const filteredPorts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return ports;
    return ports.filter((port) => {
      const locode = port.locode.toLowerCase();
      const name = port.name.toLowerCase();
      return locode.includes(value) || name.includes(value);
    });
  }, [ports, query]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12 md:px-8">
        <header className="border-b border-border/60 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> 返回上一页
              </button>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                {country.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                ISO 代码：
                <button
                  type="button"
                  className="ml-1 rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  onClick={() => {
                    void copyWithToast(country.code, "国家代码");
                  }}
                >
                  {country.code}
                </button>
              </p>
            </div>
            <div className="relative w-full max-w-sm">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="筛选港口或 LOCODE"
                className="h-10 rounded-2xl border-0 bg-muted/60 pl-10 text-sm shadow-inner focus-visible:rounded-2xl focus-visible:border-ring/60"
                aria-label="筛选港口"
              />
            </div>
          </div>
        </header>

        <section className="mt-8 flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPorts.length > 0 ? (
              filteredPorts.map((port) => (
                <PortCard key={port.locode} port={port} />
              ))
            ) : (
              <div className="md:col-span-2 rounded-3xl border border-dashed border-border/70 bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                没有匹配的港口，换个关键词再试试。
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

type PortCardProps = {
  port: Port;
};

function PortCard({ port }: PortCardProps) {
  return (
    <button
      type="button"
      onClick={() => {
        void copyWithToast(port.locode, "LOCODE");
      }}
      className="flex w-full cursor-pointer flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`复制 ${port.name} 的 LOCODE ${port.locode}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {port.countryCode}
          </span>
          <h2 className="text-lg font-semibold text-foreground">{port.name}</h2>
        </div>
        <span className="rounded-md bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
          {port.locode}
        </span>
      </div>
    </button>
  );
}
