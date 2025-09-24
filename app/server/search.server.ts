import path from "node:path";
import * as duck from "@duckdb/node-api";

export type PortRow = {
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
  const db = await duck.DuckDBInstance.create(":memory:");
  const conn = await duck.DuckDBConnection.create(db);

  const file = path.resolve(process.cwd(), "data/unlocode.json");
  const lit = file.replace(/'/g, "''");
  // DuckDB cannot prepare DDL; inline the path literal here.
  await conn.run(`CREATE VIEW raw AS SELECT * FROM read_json_auto('${lit}')`);

  let countryRows: CountryRow[] = [];
  let portRows: PortRow[] = [];

  if (q && q.trim().length > 0) {
    const cr = await conn.runAndReadAll(
      `SELECT code, name
       FROM raw
       WHERE lower(name) LIKE '%' || lower(?1) || '%'
          OR lower(code) LIKE '%' || lower(?1) || '%'
       ORDER BY name
       LIMIT 10`,
      [q]
    );
    await cr.readAll();
    countryRows = cr.getRowObjectsJS() as CountryRow[];

    const pr = await conn.runAndReadAll(
      `SELECT 
         struct_extract(p.unnest, 'locode') AS locode,
         struct_extract(p.unnest, 'name') AS name,
         r.code AS countryCode,
         r.name AS countryName
       FROM raw r, UNNEST(r.ports) AS p(unnest)
       WHERE lower(struct_extract(p.unnest, 'name')) LIKE '%' || lower(?1) || '%'
          OR lower(struct_extract(p.unnest, 'locode')) LIKE '%' || lower(?1) || '%'
          OR lower(r.name) LIKE '%' || lower(?1) || '%'
       ORDER BY
         CASE WHEN lower(struct_extract(p.unnest, 'name')) LIKE '%' || lower(?1) || '%' THEN 0 ELSE 1 END,
         CASE WHEN lower(r.name) LIKE '%' || lower(?1) || '%' THEN 0 ELSE 1 END,
         struct_extract(p.unnest, 'name') ASC
       LIMIT 200`,
      [q]
    );
    await pr.readAll();
    portRows = pr.getRowObjectsJS() as PortRow[];
  } else {
    const cr = await conn.runAndReadAll(`SELECT code, name FROM raw LIMIT 10`);
    await cr.readAll();
    countryRows = cr.getRowObjectsJS() as CountryRow[];

    const pr = await conn.runAndReadAll(
      `SELECT 
         struct_extract(p.unnest, 'locode') AS locode,
         struct_extract(p.unnest, 'name') AS name,
         r.code AS countryCode,
         r.name AS countryName
       FROM raw r, UNNEST(r.ports) AS p(unnest)
       LIMIT 10`
    );
    await pr.readAll();
    portRows = pr.getRowObjectsJS() as PortRow[];
  }

  return { countries: countryRows, ports: portRows };
}
