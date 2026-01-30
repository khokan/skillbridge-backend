import { prisma } from "../../lib/prisma";

export const CategoriesService = {
  list: async () => {
    const items = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    return { items };
  },
};
