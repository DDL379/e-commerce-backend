import prisma from "../configs/prisma.config.js";

export const dashboardService = {
  async getDailySummary(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. ดึงข้อมูลสรุปยอดขายและจำนวนบิลที่สำเร็จ
    const summary = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        status: "PAID",
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 2. ดึงจำนวนบิลที่ยกเลิก (Void Orders) เพื่อทำ Report
    const voidCount = await prisma.order.count({
      where: {
        status: "CANCELLED",
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 3. แยกยอดตามวิธีชำระเงิน
    const paymentSummary = await prisma.order.groupBy({
      by: ["paymentMethod"],
      _sum: { totalAmount: true },
      where: {
        status: "PAID",
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 4. ดึงข้อมูลเมนูขายดี พร้อมยอดรวมเงินจริงที่ได้รับของเมนูนั้น
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
        price: true, // ✅ ใช้การรวมราคาจริงที่เกิดขึ้นในแต่ละบรรทัดออเดอร์
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const bestSellers = bestSellersRaw.map((item) => ({
      menuName: item.menuName,
      totalQuantity: item._sum.quantity || 0,
      totalAmount: Number(item._sum.price) || 0, // ✅ ได้ยอดเงินรวมที่ถูกต้องไม่ต้องไป query ซ้ำ
    }));

    const cashTotal =
      paymentSummary.find((p) => p.paymentMethod === "CASH")?._sum
        .totalAmount || 0;
    const transferTotal =
      paymentSummary.find((p) => p.paymentMethod === "TRANSFER")?._sum
        .totalAmount || 0;

    return {
      totalRevenue: Number(summary._sum.totalAmount) || 0,
      totalOrders: summary._count.id || 0,
      voidOrders: voidCount || 0, // ✅ เพิ่มข้อมูลบิลที่ยกเลิก
      cashTotal: Number(cashTotal),
      transferTotal: Number(transferTotal),
      bestSellers,
    };
  },
};
