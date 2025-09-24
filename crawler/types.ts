export interface Port {
  locode: string;
  name: string;
}

export interface Country {
  code: string;
  name: string;
  ports: Array<Port>;
}
