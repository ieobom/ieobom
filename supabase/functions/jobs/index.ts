import { createClient } from "@supabase/supabase-js";
import { env, supabaseKey } from "../_shared/env.ts";
import { makeHandler, type Store, type Targets } from "./handler.ts";

function store(): Store {
  const admin = createClient(env("SUPABASE_URL"), supabaseKey("secret"), { auth: { persistSession: false } });
  return {
    async targets() {
      const { data, error } = await admin.rpc("storage_cleanup_targets");
      if (error) throw error;
      return data as unknown as Targets;
    },
    async remove(bucket, names) {
      const { error } = await admin.storage.from(bucket).remove(names);
      if (error) throw error;
    },
    async done(bucket, names) {
      const { error } = await admin.rpc("storage_cleanup_done", { bucket, names });
      if (error) throw error;
    },
  };
}

Deno.serve(makeHandler({ secret: () => Deno.env.get("CRON_SECRET") ?? "", store }));
