import prisma from "../configs/prisma.config.js";

export const dashboardService = {
  async getDailySummary(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const summary = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        status: "PAID",
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const voidCount = await prisma.order.count({
      where: {
        status: "CANCELLED",
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    // ✅ ดึงข้อมูลเพื่อมาแยกคำนวณเงินสด/เงินโอน (ดึงแค่ paymentMethod กับยอดรวมพอ)
    const paidOrders = await prisma.order.findMany({
      where: {
        status: "PAID",
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        paymentMethod: true,
        totalAmount: true,
      },
    });

    let cashTotal = 0;
    let transferTotal = 0;

    paidOrders.forEach((order) => {
      const method = order.paymentMethod || "";

      if (method.startsWith("SPLIT")) {
        const cashMatch = method.match(/CASH=(\d+)/);
        const transferMatch = method.match(/TRANSFER=(\d+)/);

        cashTotal += cashMatch ? Number(cashMatch[1]) : 0;
        transferTotal += transferMatch ? Number(transferMatch[1]) : 0;
      } else if (method === "CASH") {
        cashTotal += Number(order.totalAmount) || 0;
      } else if (method === "TRANSFER") {
        transferTotal += Number(order.totalAmount) || 0;
      }
    });

    const bestSellersRaw = await prisma.orderItem.groupBy({
      by: ["menuName"],
      where: {
        order: {
          status: "PAID",
          updatedAt: { gte: startOfDay, lte: endOfDay },
        },
      },
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: 5,
    });

    const bestSellers = bestSellersRaw.map((item) => ({
      menuName: item.menuName,
      totalQuantity: item._sum.quantity || 0,
      totalAmount: Number(item._sum.price) || 0,
    }));

    return {
      totalRevenue: Number(summary._sum.totalAmount) || 0,
      totalOrders: summary._count.id || 0,
      voidOrders: voidCount || 0,
      cashTotal, // ยอดเงินสดเป๊ะๆ (รวมที่จ่ายแยกแล้ว)
      transferTotal, // ยอดเงินโอนเป๊ะๆ (รวมที่จ่ายแยกแล้ว)
      bestSellers,
    };
  },
};
