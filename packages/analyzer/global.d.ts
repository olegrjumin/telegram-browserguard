declare module "tldts" {
  export function parse(url: string): {
    publicSuffix: string;
    domain: string;
  };
}
