import { Prisma } from "@prisma/client";

type PrismaClientLike = {
  componentConnectionPoint: {
    findMany: (args: {
      where: { componentAssetId: string };
      orderBy: Array<{ pointType: "asc" } | { label: "asc" } | { pointKey: "asc" }>;
      select: {
        pointKey: true;
        label: true;
        pointType: true;
        x: true;
        y: true;
        description: true;
      };
    }) => Promise<
      Array<{
        pointKey: string;
        label: string;
        pointType: string;
        x: number;
        y: number;
        description: string | null;
      }>
    >;
  };
  componentAsset: {
    update: (args: {
      where: { id: string };
      data: { anchorPointsJson: Prisma.InputJsonValue | Prisma.JsonNull };
    }) => Promise<unknown>;
  };
};

export async function syncComponentAssetAnchorPoints(
  prisma: PrismaClientLike,
  componentAssetId: string
) {
  const points = await prisma.componentConnectionPoint.findMany({
    where: { componentAssetId },
    orderBy: [{ pointType: "asc" }, { label: "asc" }, { pointKey: "asc" }],
    select: {
      pointKey: true,
      label: true,
      pointType: true,
      x: true,
      y: true,
      description: true,
    },
  });

  await prisma.componentAsset.update({
    where: { id: componentAssetId },
    data: {
      anchorPointsJson:
        points.length > 0
          ? (points.map((point) => ({
              key: point.pointKey,
              label: point.label,
              pointType: point.pointType,
              x: point.x,
              y: point.y,
              description: point.description,
            })) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });
}
