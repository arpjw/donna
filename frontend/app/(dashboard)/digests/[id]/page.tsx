import { auth } from "@clerk/nextjs/server";
import { digestsApi } from "@/lib/api";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function DigestDetailPage({ params }: Props) {
  const { getToken } = await auth();
  const token = await getToken();

  let digest;
  try {
    digest = await digestsApi.get(params.id, token ?? undefined);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      <Link
        href="/digests"
        className="text-xs text-text-tertiary font-mono uppercase tracking-wider hover:text-text-secondary transition-colors mb-8 inline-block"
      >
        ← Back to digests
      </Link>
      <div className="border-b border-border pb-5 mb-8">
        <p className="text-xs text-text-tertiary font-mono mb-2">
          {formatDate(digest.period_start)} — {formatDate(digest.period_end)}
        </p>
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          {digest.headline}
        </h1>
        {digest.sent_at && (
          <p className="text-xs text-text-tertiary font-mono mt-2">
            Sent {formatDate(digest.sent_at)}
          </p>
        )}
      </div>

      {/* Render HTML digest content */}
      <div
        className="font-sans text-text-secondary leading-relaxed [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-text-primary [&_h1]:mb-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mb-3 [&_h3]:font-sans [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_h3]:mb-2 [&_p]:mb-4 [&_strong]:text-text-primary [&_a]:text-crimson [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:mb-1"
        dangerouslySetInnerHTML={{ __html: digest.assembled_html }}
      />
    </div>
  );
}
