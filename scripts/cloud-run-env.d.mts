export function parseEnv(text: string): Record<string, string>;
export function toShell(env: Record<string, string>): string;
export function toYaml(env: Record<string, string>): string;
