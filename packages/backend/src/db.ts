import * as duck from "@duckdb/node-api";

let instancePromise: Promise<duck.DuckDBInstance> | null = null;

export async function getDuckDBInstance() {
  if (!instancePromise) {
    instancePromise = duck.DuckDBInstance.fromCache(":memory:");
  }
  return instancePromise;
}

export async function getConnection() {
  const instance = await getDuckDBInstance();
  return duck.DuckDBConnection.create(instance);
}
