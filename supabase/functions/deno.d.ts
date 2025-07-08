declare namespace Deno {
  const serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  namespace env {
    function get(key: string): string | undefined;
  }
}