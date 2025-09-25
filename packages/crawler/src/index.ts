import fs, { promises as fsp } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import consola from "consola";
import { fetchCountryList } from "./country-list";
import { fetchCountryLocodes } from "./country";
import type { Country, Port } from "./types";
import pAll from "p-all";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = process.env.WORKSPACE_ROOT
  ? path.resolve(process.env.WORKSPACE_ROOT)
  : process.env.INIT_CWD
    ? path.resolve(process.env.INIT_CWD)
    : path.resolve(__dirname, "../../../");
const dataDir = path.join(workspaceRoot, "data");
consola.info("dataDir: " + dataDir);
if (!fs.existsSync(dataDir)) {
  await fsp.mkdir(dataDir, { recursive: true });
}

// 调用并写入文件
const countryList = await fetchCountryList();
await fsp.writeFile(
  path.join(dataDir, "country.json"),
  JSON.stringify(countryList, null, 2),
);

// 根据 types 中的 Country 输出结构化的国家及其港口列表
const countries: Country[] = await pAll(
  countryList.map((c) => async () => {
    const rows = await pAll(
      c.links.map(
        (link) => () =>
          fetchCountryLocodes(link).finally(() =>
            consola.info(`${link} is ok`),
          ),
      ),
      { concurrency: 3 },
    ).then((lists) => lists.flat());

    // 去重：按 locode 去重
    const portMap = new Map<string, Port>();
    for (const r of rows) {
      const name = r.nameWoDiacritics || r.name;
      if (!r.locode || !name) continue;
      if (!portMap.has(r.locode)) {
        portMap.set(r.locode, { locode: r.locode, name, lnglat: r.lnglat });
      }
    }

    return {
      code: c.contryCode,
      name: c.label,
      ports: Array.from(portMap.values()),
    } satisfies Country;
  }),
  { concurrency: 3 },
);

await fsp.writeFile(
  path.join(dataDir, "unlocode.json"),
  JSON.stringify(countries, null, 2),
);
