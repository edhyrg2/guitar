import { notFound, redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { MyDesignSetupDetailContent } from "@/components/my-design-setup-detail-content";
import { WiringTemplateDetailContent } from "@/components/wiring-template-detail-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSafeServerSession } from "@/lib/auth-session";
import { getPrismaClient } from "@/lib/prisma";
import { getWiringTemplateDetailByIdForUser } from "@/lib/wiring-template-data";

export default async function MyDesignSetupDetailPage(
  props: PageProps<"/my-design/setup/[id]">
) {
  const session = await getSafeServerSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-design");
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    throw new Error("Database connection is not available.");
  }

  const { id } = await props.params;
  const setup = await prisma.builderSavedSetup.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      publishedTemplateId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!setup) {
    notFound();
  }

  const template = setup.publishedTemplateId
    ? await getWiringTemplateDetailByIdForUser(
        setup.publishedTemplateId,
        session.user.id
      )
    : null;

  return (
    <SidebarProvider>
      <AppSidebar activePath="/my-design" />
      <SidebarInset>
        {template ? (
          <WiringTemplateDetailContent
            template={template}
            editHref={`/custom-builder?savedSetupId=${encodeURIComponent(setup.id)}`}
            backHref="/my-design"
            backLabel="Back to My Design"
          />
        ) : (
          <MyDesignSetupDetailContent
            item={{
              id: setup.id,
              title: setup.name,
              description: setup.description,
              status: "Draft",
              createdAt: setup.createdAt.toISOString(),
              updatedAt: setup.updatedAt.toISOString(),
            }}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
