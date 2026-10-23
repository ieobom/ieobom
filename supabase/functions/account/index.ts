import { createClient } from "@supabase/supabase-js";
import { env, supabaseKey } from "../_shared/env.ts";
import { type AccountStore, type KakaoUnlink, makeHandler } from "./handler.ts";

function store(): AccountStore {
  const admin = createClient(env("SUPABASE_URL"), supabaseKey("secret"), { auth: { persistSession: false } });
  return {
    async kakaoId(uid) {
      const { data, error } = await admin.auth.admin.getUserById(uid);
      if (error) {
        if (error.status === 404) return null;
        throw error;
      }
      const identity = data.user.identities?.find((i) => i.provider === "kakao");
      const sub = identity?.identity_data?.sub ?? identity?.identity_data?.provider_id ?? identity?.id;
      return sub ? String(sub) : null;
    },
    async photoPaths(uid) {
      const news = await admin.from("news").select("id").eq("author_id", uid);
      if (news.error) throw news.error;
      if (!news.data.length) return [];
      const photos = await admin
        .from("news_photos")
        .select("file_path, thumb_path")
        .in(
          "news_id",
          news.data.map((n) => n.id),
        );
      if (photos.error) throw photos.error;
      return photos.data.flatMap((p) => [p.file_path, p.thumb_path]);
    },
    async removePhotos(paths) {
      const { error } = await admin.storage.from("news-photos").remove(paths);
      if (error) throw error;
    },
    async deleteUser(uid) {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error && error.status !== 404) throw error;
    },
    async clearTrash(paths) {
      const { error } = await admin.rpc("storage_cleanup_done", { bucket: "news-photos", names: paths });
      if (error) throw error;
    },
  };
}

// 카카오 연결 끊기(어드민 키). 이미 끊긴 사용자(-101)는 끝난 것으로 본다
function unlink(): KakaoUnlink | null {
  const key = Deno.env.get("KAKAO_ADMIN_KEY");
  if (!key) return null;
  return async (kakaoId) => {
    const res = await fetch("https://kapi.kakao.com/v1/user/unlink", {
      method: "POST",
      headers: {
        authorization: `KakaoAK ${key}`,
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({ target_id_type: "user_id", target_id: kakaoId }),
    });
    if (res.ok) return "unlinked";
    const body = (await res.json().catch(() => ({}))) as { code?: number };
    if (body.code === -101) return "not_linked";
    throw new Error(`kakao unlink failed: ${res.status} ${body.code ?? ""}`);
  };
}

Deno.serve(makeHandler({ store, unlink }));
