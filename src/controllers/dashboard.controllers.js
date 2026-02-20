import { dashboardService } from "../services/dashboard.service.js";

export const dashboardController = {
  async getSummary(req, res, next) {
    try {
      const { date } = req.query;

      let targetDate = date ? new Date(date) : new Date();

      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "รูปแบบวันที่ไม่ถูกต้อง (Invalid Date Format)",
        });
      }

      const report = await dashboardService.getDailySummary(targetDate);

      res.json({
        status: "success",
        date: targetDate.toLocaleDateString("en-CA"), // รูปแบบ YYYY-MM-DD
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },
};
