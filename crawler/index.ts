import fs, { promises as fsp } from "node:fs";
import path from "node:path";
import consola from "consola";
import { fetchCountryList } from "./country-list";
import { fetchCountryLocodes } from "./country";
import pAll from "p-all";

const dataDir = path.resolve(process.cwd(), "data");
consola.info("dataDir: " + dataDir);
if (!fs.existsSync(dataDir)) {
  await fsp.mkdir(dataDir, { recursive: true });
}

// 调用并写入文件
const countryList = await fetchCountryList();
await fsp.writeFile(
  path.join(dataDir, "country.json"),
  JSON.stringify(countryList),
);

const unlocode = await pAll(
  countryList
    .flatMap((country) => country.links)
    .map(
      (link) => () =>
        fetchCountryLocodes(link).finally(() => console.log(`${link} is ok`)),
    ),
  { concurrency: 3 },
).then((codes) => codes.flat());
await fsp.writeFile(
  path.join(dataDir, "unlocode.json"),
  JSON.stringify(unlocode),
);
