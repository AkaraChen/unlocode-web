import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog,
} from "~/components/ui/command";

type RawPort = { locode: string; name: string };
type RawCountry = { code: string; name: string; ports: RawPort[] };
type Port = {
  locode: string;
  name: string;
  countryCode: string;
  countryName: string;
};
type CountryLite = { code: string; name: string };

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  // 初始数据由服务端查询，便于 SSR 首屏
  const { searchUnlocode } = await import("~/server/search.server");
  const data = await searchUnlocode(q);
  return { q, initial: data };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UN/LOCODE Search" },
    { name: "description", content: "Search countries and ports (UN/LOCODE)" },
  ];
}

export default function Home() {
  const { q, initial } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState(q ?? "");

  const { data } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to load");
      return (await res.json()) as { countries: CountryLite[]; ports: Port[] };
    },
    initialData: initial,
  });

  const countryResults = data.countries as CountryLite[];
  const portResults = data.ports as Port[];

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <CommandDialog
        open
        title="UN/LOCODE Search"
        description="Search countries and ports"
      >
        <Command>
          <CommandInput
            autoFocus
            placeholder="Type to search..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!countryResults.length && !portResults.length ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <>
                <CommandGroup heading="Countries">
                  {countryResults.map((c) => (
                    <CommandItem key={c.code} value={`${c.code}-${c.name}`}>
                      <span className="font-mono mr-2 text-muted-foreground">
                        {c.code}
                      </span>
                      <span>{c.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Ports">
                  {portResults.map((p) => (
                    <CommandItem key={p.locode} value={`${p.locode}-${p.name}`}>
                      <span className="font-mono mr-2 text-muted-foreground">
                        {p.locode}
                      </span>
                      <span className="mr-2">{p.name}</span>
                      <span className="text-muted-foreground">
                        ({p.countryName})
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </main>
  );
}
