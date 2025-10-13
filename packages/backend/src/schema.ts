import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";

export const countries = sqliteTable("countries", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  link: text("link"),
});

export const unlocode = sqliteTable(
  "unlocode",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locode: text("locode").notNull().unique(),
    name: text("name").notNull(),
    countryCode: text("country_code")
      .notNull()
      .references(() => countries.code),
    countryName: text("country_name").notNull(),
    longitude: real("longitude"),
    latitude: real("latitude"),
  },
  (table) => ({
    countryCodeIdx: index("ports_country_code_idx").on(table.countryCode),
    locodeIdx: index("ports_locode_idx").on(table.locode),
    nameIdx: index("ports_name_idx").on(table.name),
  }),
);
