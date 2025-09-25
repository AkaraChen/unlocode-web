import type { Route } from "../../.react-router/types/app/routes/+types/home";
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
  const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";
  const api = new URL("/api/search", backendBase);
  if (q) {
    api.searchParams.set("q", q);
  }

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

  const data = await res.json();
  return { q, initial: data, backendBase };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UN/LOCODE Search" },
    { name: "description", content: "Search countries and ports (UN/LOCODE)" },
  ];
}

export default function Home() {
  const { q, initial, backendBase } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState(q ?? "");

  const { data } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const target = new URL("/api/search", backendBase);
      if (query.trim()) {
        target.searchParams.set("q", query);
      }

      const res = await fetch(target);
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
