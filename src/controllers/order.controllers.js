import { orderService } from "../services/order.service.js";
import prisma from "../configs/prisma.config.js";

export const orderController = {
  // ✅ ปรับให้ ParseInt เลขโต๊ะให้ชัวร์ก่อนส่งเข้า Service
  async getOrCreateOrder(req, res, next) {
    try {
      const tableNumber = parseInt(req.params.tableNumber);
      if (isNaN(tableNumber))
        return res.status(400).json({ message: "เลขโต๊ะไม่ถูกต้อง" });

      const order = await orderService.getOrCreateTableOrder(tableNumber);
      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  async addItems(req, res, next) {
    try {
      const { orderId, cartItems } = req.body;
      const result = await orderService.addItemsToOrder(orderId, cartItems);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      // 💡 ปรับตรงนี้ให้พ่น error.message จริงๆ ออกมา
      console.error("❌ Controller Catch Error:", error);
      res.status(400).json({
        status: "error",
        message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        details: error.stack, // ดูว่ามันพังที่บรรทัดไหนในโค้ด
      });
    }
  },
  async updateOrderItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const result = await orderService.updateOrderItem(itemId, req.body);
      res.json({
        status: "success",
        message: "อัปเดตรายการอาหารสำเร็จ",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async removeOrderItem(req, res, next) {
    try {
      const { itemId } = req.params;
      await orderService.removeOrderItem(itemId);
      res.json({ status: "success", message: "ลบรายการอาหารสำเร็จ" });
    } catch (error) {
      next(error);
    }
  },

  async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;
      const result = await orderService.deleteOrder(id);
      res.json({ status: "success", message: "ยกเลิกบิลสำเร็จ", data: result });
    } catch (error) {
      next(error);
    }
  },

  async getReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: { items: true },
      });

      if (!order) {
        return res
          .status(404)
          .json({ status: "error", message: "ไม่พบข้อมูลบิล" });
      }

      res.json({ status: "success", data: order });
    } catch (error) {
      next(error);
    }
  },

  async getTablesStatus(req, res, next) {
    try {
      const totalTables = 12; // 🏠 ปรับตามจำนวนโต๊ะจริงของร้านคุณแบงค์

      const openOrders = await prisma.order.findMany({
        where: { status: "OPEN" },
        select: { id: true, tableNumber: true, totalAmount: true },
      });

      const tables = Array.from({ length: totalTables }, (_, i) => {
        const tableId = i + 1;
        const activeOrder = openOrders.find((o) => o.tableNumber === tableId);

        return {
          id: tableId,
          status: activeOrder ? "busy" : "empty",
          orderId: activeOrder ? activeOrder.id : null,
          totalAmount: activeOrder ? Number(activeOrder.totalAmount) : 0, // ✅ มั่นใจว่าเป็น Number
        };
      });

      res.json(tables);
    } catch (error) {
      next(error);
    }
  },

  async checkout(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;

      if (!id) return res.status(400).json({ message: "ไม่พบ ID ของบิล" });

      const order = await orderService.checkout(id, { paymentMethod });

      res.json({
        status: "success",
        message: "เช็คบิลเรียบร้อย",
        data: order,
      });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  },

  async getOrderHistory(req, res, next) {
    try {
      const { type, date } = req.query;
      const selectedDate = date ? new Date(date) : new Date();

      let startDate, endDate;

      if (type === "monthly") {
        startDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        );
        endDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
      } else {
        startDate = new Date(selectedDate.setHours(0, 0, 0, 0));
        endDate = new Date(selectedDate.setHours(23, 59, 59, 999));
      }

      const orders = await prisma.order.findMany({
        where: {
          status: { in: ["PAID", "CANCELLED"] },
          updatedAt: { gte: startDate, lte: endDate },
        },
        include: { items: true },
        orderBy: { updatedAt: "desc" },
      });

      res.json({ status: "success", data: orders });
    } catch (error) {
      next(error);
    }
  },
};
