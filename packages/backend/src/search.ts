import { db } from "./db";
import { countries, unlocode } from "./schema";
import { or, sql } from "drizzle-orm";

export type UnlocodeRow = {
  locode: string;
  name: string;
  countryCode: string;
  countryName: string;
};

export type CountryRow = {
  code: string;
  name: string;
};

export async function searchUnlocode(q: string | null) {
  if (!q || q.trim().length === 0) {
    throw new Error("Query parameter is required");
  }

  const query = `%${q.toLowerCase()}%`;

  const countryRows = await db
    .select({ code: countries.code, name: countries.name })
    .from(countries)
    .where(
      or(
        sql`lower(${countries.name}) LIKE ${query}`,
        sql`lower(${countries.code}) LIKE ${query}`,
      ),
    )
    .orderBy(countries.name)
    .limit(10);

  const unlocodeRows = await db
    .select({
      locode: unlocode.locode,
      name: unlocode.name,
      countryCode: unlocode.countryCode,
      countryName: unlocode.countryName,
    })
    .from(unlocode)
    .where(
      or(
        sql`lower(${unlocode.name}) LIKE ${query}`,
        sql`lower(${unlocode.locode}) LIKE ${query}`,
        sql`lower(${unlocode.countryName}) LIKE ${query}`,
      ),
    )
    .orderBy(
      sql`CASE WHEN lower(${unlocode.name}) LIKE ${query} THEN 0 ELSE 1 END`,
      sql`CASE WHEN lower(${unlocode.countryName}) LIKE ${query} THEN 0 ELSE 1 END`,
      unlocode.name,
    )
    .limit(200);

  return { countries: countryRows, unlocode: unlocodeRows };
}

export async function getCountryDetail(code: string) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    throw new Error("Country code is required");
  }

  const [country] = await db
    .select({ code: countries.code, name: countries.name })
    .from(countries)
    .where(sql`upper(${countries.code}) = ${trimmed}`)
    .limit(1);

  if (!country) {
    throw Object.assign(new Error(`Country ${trimmed} not found`), {
      status: 404,
    });
  }

  const unlocodeList = await db
    .select({
      locode: unlocode.locode,
      name: unlocode.name,
      countryCode: unlocode.countryCode,
      countryName: unlocode.countryName,
    })
    .from(unlocode)
    .where(sql`upper(${unlocode.countryCode}) = ${trimmed}`)
    .orderBy(unlocode.name);

  return { country, unlocode: unlocodeList };
}
