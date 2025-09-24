import * as cheerio from "cheerio";

export type CountryRow = {
  contryCode: string;
  label: string;
  links: string[];
};

const indexUrl =
  "https://unece.org/trade/cefact/unlocode-code-list-country-and-territory";

export async function fetchCountryList(): Promise<CountryRow[]> {
  const html = await fetch(indexUrl).then((r) => r.text());
  const $ = cheerio.load(html);

  const table = $('table:has(th:contains("ISO 3166-1"))').first();

  const rows = table.find("tr").filter((_, tr) => $(tr).find("td").length >= 2);

  const data: CountryRow[] = rows
    .toArray()
    .map((tr) => {
      const tds = $(tr).find("td");
      const iso = tds.eq(0).text().trim();
      const cell = tds.eq(1);

      // 清洗 label：去掉后面类似 "[A to E] [F to J] ..." 的分段链接文本，只保留国家名称
      // 先标准化空白，再裁剪从第一个 "[" 起的内容
      const rawLabel = cell.text().replace(/\s+/g, " ").trim();
      const label = rawLabel.replace(/\s*\[.*$/, "").trim();

      // 所有 a 的 href，规范化为绝对地址并去重
      const linkSet = new Set<string>();
      cell.find("a[href]").each((_, a) => {
        const href = $(a).attr("href")?.trim();
        if (!href) return;
        // 站内可能给相对路径，这里做基准规范化
        const abs = new URL(href, indexUrl).href;
        linkSet.add(abs);
      });

      return {
        contryCode: iso,
        label,
        links: Array.from(linkSet),
      };
    })
    // 过滤掉可能的空行
    .filter((r) => r.contryCode && r.label);

  return data;
}
