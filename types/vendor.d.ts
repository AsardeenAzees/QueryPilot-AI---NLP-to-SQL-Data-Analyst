declare module "pgsql-ast-parser" {
  export interface AstStatement { type: string; [key: string]: unknown }
  export function parse(sql: string): AstStatement[];
}

declare module "tailwind-merge" {
  type ClassNameValue = string | undefined | null | false;
  export function twMerge(...classLists: ClassNameValue[]): string;
}
