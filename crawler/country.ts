import * as cheerio from "cheerio";

export type CountryLocodeRow = {
  change: string;
  countryCode: string;
  locationCode: string;
  locode: string;
  name: string;
  nameWoDiacritics: string;
  subDiv: string;
  function: string;
  status: string;
  date: string;
  iata: string;
  lnglat?: [number, number]; // [lng, lat] GeoJSON 顺序
  remarks: string;
};

export async function fetchCountryLocodes(
  url: string,
): Promise<CountryLocodeRow[]> {
  const html = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(html);

  // 直接用 :has + :contains 选表格
  const table = $(
    'table:has(td a:contains("Name")), table:has(th:contains("Name"))',
  ).first();

  const clean = (s: string) =>
    s
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // 解析坐标为 GeoJSON 风格 [lng, lat]（十进制度）
  const parseLngLatDM = (s: string): [number, number] | undefined => {
    const text = s.replace(/\u00a0/g, " ").trim();
    if (!text) return undefined;
    // 匹配 DDMMN DDDMME / DDMMNDDDMME（中间空白可有可无）
    const m = text.match(/^(\d{2})(\d{2})([NS])\s*(\d{3})(\d{2})([EW])$/i);
    if (!m) return undefined;
    const latDeg = parseInt(m[1], 10);
    const latMin = parseInt(m[2], 10);
    const latHem = m[3].toUpperCase();
    const lngDeg = parseInt(m[4], 10);
    const lngMin = parseInt(m[5], 10);
    const lngHem = m[6].toUpperCase();

    let lat = latDeg + latMin / 60;
    let lng = lngDeg + lngMin / 60;
    if (latHem === "S") lat = -lat;
    if (lngHem === "W") lng = -lng;
    const latRounded = Math.round(lat * 100) / 100;
    const lngRounded = Math.round(lng * 100) / 100;
    return [lngRounded, latRounded];
  };

  // 遍历行，跳过表头
  const rows = table.find("tr").slice(1);

  const items: CountryLocodeRow[] = rows
    .toArray()
    .map((tr) => {
      const tds = $(tr).find("td");
      // 至少 11 列（Ch, LOCODE, Name, NameWoDiacritics, SubDiv, Function, Status, Date, IATA, Coordinates, Remarks）
      if (tds.length < 11) return null;

      const change = clean(tds.eq(0).text());

      const locodeCell = clean(tds.eq(1).text()); // 例："DZ  AZR"
      let countryCode = "";
      let locationCode = "";
      const m = locodeCell.match(/^([A-Z]{2})\s+([A-Z0-9]{3})$/i);
      if (m) {
        countryCode = m[1].toUpperCase();
        locationCode = m[2].toUpperCase();
      } else {
        const parts = locodeCell.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          countryCode = (parts[0] || "").toUpperCase();
          locationCode = (parts[1] || "").toUpperCase();
        }
      }
      const locode =
        countryCode && locationCode
          ? `${countryCode}${locationCode}`
          : locodeCell;

      const name = clean(tds.eq(2).text());
      const nameWoDiacritics = clean(tds.eq(3).text());
      const subDiv = clean(tds.eq(4).text());
      const fn = clean(tds.eq(5).text());
      const status = clean(tds.eq(6).text());
      const date = clean(tds.eq(7).text());
      const iata = clean(tds.eq(8).text());
      const coordinatesCell = clean(tds.eq(9).text());
      const lnglat = parseLngLatDM(coordinatesCell);
      const remarks = clean(tds.eq(10).text());

      if (!locodeCell || !name) return null;

      const base = {
        change,
        countryCode,
        locationCode,
        locode,
        name,
        nameWoDiacritics,
        subDiv,
        function: fn,
        status,
        date,
        iata,
        remarks,
      } as const;

      return lnglat ? { ...base, lnglat } : base;
    })
    .filter((x): x is CountryLocodeRow => !!x);

  return items.sort();
}
