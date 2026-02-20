import prisma from "../configs/prisma.config.js";

export const orderService = {
  // 1. จัดการการเช็คบิล (Checkout)
  async checkout(orderId, paymentData) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: parseInt(orderId) },
      });

      if (!order || order.status !== "OPEN") {
        throw new Error("ไม่พบออเดอร์ที่สามารถเช็คบิลได้");
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const lastOrderToday = await tx.order.findFirst({
        where: {
          createdAt: { gte: startOfToday },
          billNumber: { not: null },
        },
        orderBy: { billNumber: "desc" },
      });

      const nextBillNumber = (lastOrderToday?.billNumber || 0) + 1;

      return await tx.order.update({
        where: { id: parseInt(orderId) },
        data: {
          billNumber: nextBillNumber,
          paymentMethod: paymentData.paymentMethod,
          status: "PAID",
          updatedAt: new Date(),
        },
      });
    });
  },

  // 2. คำนวณราคารวมใหม่ (Helper Function)
  async recalculateOrderTotal(orderId) {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: parseInt(orderId) },
    });

    const totalAmount = orderItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    return await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { totalAmount: totalAmount },
    });
  },

  // 3. หาหรือสร้างออเดอร์ใหม่ตามเลขโต๊ะ (ใช้ในหน้าโต๊ะ)
  async getOrCreateTableOrder(tableNumber) {
    let order = await prisma.order.findFirst({
      where: { tableNumber: parseInt(tableNumber), status: "OPEN" },
      include: { items: true },
    });

    if (!order) {
      order = await prisma.order.create({
        data: { tableNumber: parseInt(tableNumber), status: "OPEN" },
        include: { items: true },
      });
    }
    return order;
  },

  async addItemsToOrder(orderId, cartItems) {
    return await prisma.$transaction(async (tx) => {
      // 1. ตรวจสอบสถานะบิล
      const order = await tx.order.findUnique({
        where: { id: Number(orderId) },
      });
      if (!order || order.status !== "OPEN")
        throw new Error("บิลปิดไปแล้วหรือไม่พบข้อมูล");

      // 2. เตรียมข้อมูลบันทึก (OrderItem)
      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: Number(orderId),
          menuName: item.name,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.options?.totalPrice ?? item.price),
          options: item.options || {}, // บันทึกลงฟิลด์ Json
        })),
      });

      // 3. คำนวณยอดรวมใหม่
      const allItems = await tx.orderItem.findMany({
        where: { orderId: Number(orderId) },
      });
      const total = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      // 4. อัปเดตยอดเงินในบิลหลัก
      return await tx.order.update({
        where: { id: Number(orderId) },
        data: { totalAmount: total },
        include: { items: true },
      });
    });
  },
  // 5. อัปเดตรายการอาหารรายชิ้น
  async updateOrderItem(itemId, data) {
    const updatedItem = await prisma.orderItem.update({
      where: { id: parseInt(itemId) },
      data: {
        quantity: data.quantity ? parseInt(data.quantity) : undefined,
        // ถ้ามีการแก้ options ให้ลองเช็คราคาใหม่ด้วย
        price: data.options?.totalPrice
          ? parseFloat(data.options.totalPrice)
          : undefined,
        options: data.options,
      },
    });
    await this.recalculateOrderTotal(updatedItem.orderId);
    return updatedItem;
  },

  // 6. ลบรายการอาหาร
  async removeOrderItem(itemId) {
    const item = await prisma.orderItem.findUnique({
      where: { id: parseInt(itemId) },
    });
    if (item) {
      await prisma.orderItem.delete({ where: { id: parseInt(itemId) } });
      await this.recalculateOrderTotal(item.orderId);
    }
  },

  // 7. ยกเลิกออเดอร์
  async deleteOrder(id) {
    return await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status: "CANCELLED" },
    });
  },
};
