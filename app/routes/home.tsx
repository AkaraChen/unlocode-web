import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog,
} from "~/components/ui/command";

type Port = { locode: string; name: string };
type Country = { code: string; name: string; ports: Port[] };

export async function loader() {
  const pathMod = await import("node:path");
  const fsp = await import("node:fs/promises");
  const file = pathMod.resolve(process.cwd(), "data/unlocode.json");
  const text = await fsp.readFile(file, "utf-8");
  const countries = JSON.parse(text) as Country[];
  return { countries };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UN/LOCODE Search" },
    { name: "description", content: "Search countries and ports (UN/LOCODE)" },
  ];
}

export default function Home() {
  const { countries } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");

  const { countryFuse, portFuse, portsFlat } = useMemo(() => {
    const portsFlat: Array<{
      type: "port";
      countryCode: string;
      countryName: string;
      locode: string;
      name: string;
    }> = [];
    for (const c of countries) {
      for (const p of c.ports) {
        portsFlat.push({
          type: "port",
          countryCode: c.code,
          countryName: c.name,
          locode: p.locode,
          name: p.name,
        });
      }
    }

    const countryFuse = new Fuse(countries, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "code", weight: 0.3 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
    });

    const portFuse = new Fuse(portsFlat, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "locode", weight: 0.2 },
        { name: "countryName", weight: 0.1 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
    });

    return { countryFuse, portFuse, portsFlat };
  }, [countries]);

  const countryResults = useMemo(() => {
    if (!query) return countries.slice(0, 10);
    return countryFuse
      .search(query)
      .slice(0, 10)
      .map((r) => r.item);
  }, [query, countryFuse, countries]);

  const portResults = useMemo(() => {
    if (!query) return portsFlat.slice(0, 10);
    return portFuse
      .search(query)
      .slice(0, 10)
      .map((r) => r.item);
  }, [query, portFuse, portsFlat]);

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <CommandDialog open title="UN/LOCODE Search" description="Search countries and ports">
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
                      <span className="font-mono mr-2 text-muted-foreground">{c.code}</span>
                      <span>{c.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Ports">
                  {portResults.map((p) => (
                    <CommandItem key={p.locode} value={`${p.locode}-${p.name}`}>
                      <span className="font-mono mr-2 text-muted-foreground">{p.locode}</span>
                      <span className="mr-2">{p.name}</span>
                      <span className="text-muted-foreground">({p.countryName})</span>
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
