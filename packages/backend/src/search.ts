import fs from "node:fs";
import path from "node:path";
import { getConnection } from "./db";
import { resolveCrawlerPath } from "./paths";

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
  const conn = await getConnection();

  const file = resolveCrawlerPath("data", "unlocode.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `未找到数据文件: ${path.relative(resolveCrawlerPath(), file)}。请先运行爬虫生成数据。`,
    );
  }
  const lit = file.replace(/'/g, "''");
  await conn.run(`CREATE OR REPLACE VIEW raw AS SELECT * FROM read_json_auto('${lit}')`);

  let countryRows: CountryRow[] = [];
  let portRows: PortRow[] = [];

  try {
    if (q && q.trim().length > 0) {
      const cr = await conn.runAndReadAll(
        `SELECT code, name
         FROM raw
         WHERE lower(name) LIKE '%' || lower(?1) || '%'
            OR lower(code) LIKE '%' || lower(?1) || '%'
         ORDER BY name
         LIMIT 10`,
        [q],
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
        [q],
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
         LIMIT 10`,
      );
      await pr.readAll();
      portRows = pr.getRowObjectsJS() as PortRow[];
    }

    return { countries: countryRows, ports: portRows };
  } finally {
    try {
      await conn.run("DROP VIEW IF EXISTS raw");
    } catch {}
    try {
      conn.disconnectSync();
    } catch {}
  }
}

export async function getCountryDetail(code: string) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    throw new Error("Country code is required");
  }

  const conn = await getConnection();
  const file = resolveCrawlerPath("data", "unlocode.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `未找到数据文件: ${path.relative(resolveCrawlerPath(), file)}。请先运行爬虫生成数据。`,
    );
  }
  const lit = file.replace(/'/g, "''");
  await conn.run(`CREATE OR REPLACE VIEW raw AS SELECT * FROM read_json_auto('${lit}')`);

  try {
    const countryResult = await conn.runAndReadAll(
      `SELECT code, name FROM raw WHERE upper(code) = ?1 LIMIT 1`,
      [trimmed],
    );
    await countryResult.readAll();
    const [country] = countryResult.getRowObjectsJS() as CountryRow[];

    if (!country) {
      throw Object.assign(new Error(`Country ${trimmed} not found`), {
        status: 404,
      });
    }

    const portResult = await conn.runAndReadAll(
      `SELECT
         struct_extract(p.unnest, 'locode') AS locode,
         struct_extract(p.unnest, 'name') AS name,
         r.code AS countryCode,
         r.name AS countryName
       FROM raw r, UNNEST(r.ports) AS p(unnest)
       WHERE upper(r.code) = ?1
       ORDER BY struct_extract(p.unnest, 'name') ASC`,
      [trimmed],
    );
    await portResult.readAll();
    const ports = portResult.getRowObjectsJS() as PortRow[];

    return { country, ports };
  } finally {
    try {
      await conn.run("DROP VIEW IF EXISTS raw");
    } catch {}
    try {
      conn.disconnectSync();
    } catch {}
  }
}
