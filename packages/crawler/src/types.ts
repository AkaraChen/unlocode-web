export interface Port {
  locode: string;
  name: string;
  lnglat?: [number, number];
}

export interface Country {
  code: string;
  name: string;
  ports: Array<Port>;
}
