import { orderService } from "../services/order.service.js";
import prisma from "../configs/prisma.config.js";

export const orderController = {
  async getOrCreateOrder(req, res, next) {
    try {
      // ✅ 1. รับค่าเป็น String โดยตรง (ไม่ต้องใช้ parseInt)
      const tableNumber = req.params.tableNumber;

      // ✅ 2. ตรวจสอบว่ามีค่าส่งมาไหม
      if (!tableNumber) {
        return res.status(400).json({ message: "กรุณาระบุเลขโต๊ะ" });
      }

      // ✅ 3. ส่งค่า String ไปยัง Service
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
      // 1. กำหนดรายการโต๊ะทั้งหมดตามโซนของคุณแบงค์
      // ใช้ string สำหรับ id/number เพื่อรองรับชื่อ เช่น "รัก 1"
      const allTableConfigs = [
        { id: "1", zone: "ทั่วไป" },
        { id: "2", zone: "ทั่วไป" },
        { id: "3", zone: "ทั่วไป" },
        { id: "4", zone: "ทั่วไป" },
        { id: "5", zone: "ทั่วไป" },
        { id: "6", zone: "ทั่วไป" },
        { id: "รัก 1", zone: "โซนรัก" },
        { id: "รัก 2", zone: "โซนรัก" },
        { id: "รัก 3", zone: "โซนรัก" },
        { id: "รัก 4", zone: "โซนรัก" },
        { id: "รัก 5", zone: "โซนรัก" },
        { id: "รัก 6", zone: "โซนรัก" },
        { id: "รัก 7", zone: "โซนรัก" },
      ];

      // 2. ดึงออเดอร์ที่ค้างอยู่ (สถานะ OPEN)
      const openOrders = await prisma.order.findMany({
        where: { status: "OPEN" },
        select: { id: true, tableNumber: true, totalAmount: true },
      });

      // 3. Map ข้อมูลโต๊ะเข้ากับออเดอร์
      const tables = allTableConfigs.map((config) => {
        // ค้นหาออเดอร์ที่ tableNumber ตรงกับ id ของโต๊ะ (ต้องเช็คดีๆ ว่าใน DB เก็บเป็น String หรือ Int)
        const activeOrder = openOrders.find(
          (o) => String(o.tableNumber) === String(config.id),
        );

        return {
          id: config.id, // เช่น "1" หรือ "รัก 1"
          displayNumber: config.id, // สำหรับโชว์บนหน้าจอ
          zone: config.zone,
          status: activeOrder ? "busy" : "empty",
          orderId: activeOrder ? activeOrder.id : null,
          totalAmount: activeOrder ? Number(activeOrder.totalAmount) : 0,
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
