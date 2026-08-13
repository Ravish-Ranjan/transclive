declare namespace NodeJS {
  interface ProcessEnv {
    AUTH_SECRET?: string;
    DATABASE_URL?: string;
    [key: string]: string | undefined;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};
