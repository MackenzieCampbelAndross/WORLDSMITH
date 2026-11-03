import { Suspense } from "react";
import { connection } from "next/server";
import SharedWorld from "@/components/portal/SharedWorld";

interface Props {
  params: Promise<{ slug: string }>;
}

async function SharedWalkthrough({ params }: Props) {
  await connection();
  const { slug } = await params;
  return <SharedWorld slug={slug} chrome />;
}

export default function SharedWalkthroughPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <SharedWalkthrough {...props} />
    </Suspense>
  );
}
