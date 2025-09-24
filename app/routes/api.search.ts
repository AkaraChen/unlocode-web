import { searchUnlocode } from "~/server/search.server";
import type { Route } from "./+types/api.search";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const data = await searchUnlocode(q);
  return data;
}
