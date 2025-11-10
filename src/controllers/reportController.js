
import { Order, Table, OrderItem, Menu, sequelize } from "../models/index.js";
import { Op } from "sequelize";
import moment from "moment";

export const getReport = async (req, res) => {
  try {
    const { period, customMonth, customYear, customWeek, startDate, endDate } =
      req.query;
    let startDateFilter, endDateFilter;

    if (startDate && endDate) {
      startDateFilter = moment(startDate).startOf("day").toDate();
      endDateFilter = moment(endDate).endOf("day").toDate();
    }

    else {
      switch (period) {
        case "daily":
          startDateFilter = moment().startOf("day").toDate();
          endDateFilter = moment().endOf("day").toDate();
          break;

        case "weekly":
          if (customWeek && customYear && customMonth) {
            const year = parseInt(customYear);
            const month = parseInt(customMonth) - 1; 
            const week = parseInt(customWeek);
            

            const firstDayOfMonth = moment().year(year).month(month).startOf('month');
            // Calculate start date of the week (considering week starts from Monday)
            startDateFilter = firstDayOfMonth.add((week - 1) * 7, 'days').startOf('week').toDate();
            endDateFilter = moment(startDateFilter).endOf('week').toDate();
          } else if (customWeek && customYear) {
            const year = parseInt(customYear);
            const week = parseInt(customWeek);
            startDateFilter = moment()
              .year(year)
              .week(week)
              .startOf("week")
              .toDate();
            endDateFilter = moment()
              .year(year)
              .week(week)
              .endOf("week")
              .toDate();
          } else {
            startDateFilter = moment().startOf("week").toDate();
            endDateFilter = moment().endOf("week").toDate();
          }
          break;

        case "monthly":
          if (customMonth && customYear) {
            const year = parseInt(customYear);
            const month = parseInt(customMonth) - 1;
            startDateFilter = moment()
              .year(year)
              .month(month)
              .startOf("month")
              .toDate();
            endDateFilter = moment()
              .year(year)
              .month(month)
              .endOf("month")
              .toDate();
          } else {
            startDateFilter = moment().startOf("month").toDate();
            endDateFilter = moment().endOf("month").toDate();
          }
          break;

        case "yearly":
          if (customYear) {
            const year = parseInt(customYear);
            startDateFilter = moment().year(year).startOf("year").toDate();
            endDateFilter = moment().year(year).endOf("year").toDate();
          } else {
            startDateFilter = moment().startOf("year").toDate();
            endDateFilter = moment().endOf("year").toDate();
          }
          break;

        default:

          startDateFilter = moment().startOf("month").toDate();
          endDateFilter = moment().endOf("month").toDate();
      }
    }

    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDateFilter, endDateFilter],
        },
      },
      include: [
        {
          model: Table,
          as: "table",
          attributes: ["id", "tableNumber"],
        },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Menu,
              as: "menu",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });


    const totalSales = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount),
      0
    );
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    ).length;
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const preparingOrders = orders.filter(
      (order) => order.status === "preparing"
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;


    const completedSales = orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  
    const menuItemCounts = {};
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const menuName = item.menu.name;
        menuItemCounts[menuName] =
          (menuItemCounts[menuName] || 0) + item.quantity;
      });
    });

    const popularItems = Object.entries(menuItemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      orders,
      summary: {
        totalSales: totalSales.toFixed(2),
        totalOrders,
        completedOrders,
        pendingOrders,
        preparingOrders,
        averageOrderValue: averageOrderValue.toFixed(2),
        completedSales: completedSales.toFixed(2),
        popularItems,
        dateRange: {
          start: startDateFilter,
          end: endDateFilter,
        },
      },
    });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAvailableYears = async (req, res) => {
  try {
    const years = await Order.findAll({
      attributes: [
        [
          sequelize.fn(
            "DISTINCT",
            sequelize.fn("YEAR", sequelize.col("createdAt"))
          ),
          "year",
        ],
      ],
      order: [["year", "DESC"]],
    });

    const yearList = years
      .map((item) => item.get("year"))
      .filter((year) => year);

    if (yearList.length === 0) {
      const currentYear = new Date().getFullYear();
      yearList.push(currentYear, currentYear - 1);
    }

    res.json(yearList);
  } catch (error) {
    console.error("Get years error:", error);

    const currentYear = new Date().getFullYear();
    res.json([currentYear, currentYear - 1, currentYear - 2]);
  }
};


export const getAvailableMonths = async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const months = await Order.findAll({
      attributes: [
        [
          sequelize.fn(
            "DISTINCT",
            sequelize.fn("MONTH", sequelize.col("createdAt"))
          ),
          "month",
        ],
      ],
      where: sequelize.where(
        sequelize.fn("YEAR", sequelize.col("createdAt")),
        year
      ),
      order: [["month", "ASC"]],
    });

    const monthList = months
      .map((item) => item.get("month"))
      .filter((month) => month)
      .map(month => parseInt(month));


    if (monthList.length === 0) {
      monthList.push(...Array.from({ length: 12 }, (_, i) => i + 1));
    }

    res.json(monthList);
  } catch (error) {
    console.error("Get months error:", error);

    res.json([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  }
};


export const getAvailableWeeks = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf('month');
    const endOfMonth = moment(startOfMonth).endOf('month');
    

    const weeks = [];
    let currentWeek = 1;
    let currentDate = moment(startOfMonth);

    while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth)) {
      weeks.push({
        week: currentWeek,
        startDate: currentDate.startOf('week').format('YYYY-MM-DD'),
        endDate: currentDate.endOf('week').format('YYYY-MM-DD'),
        label: `Week ${currentWeek} (${currentDate.startOf('week').format('DD MMM')} - ${currentDate.endOf('week').format('DD MMM')})`
      });
      
      currentWeek++;
      currentDate = currentDate.add(1, 'week').startOf('week');
    }

    res.json(weeks);
  } catch (error) {
    console.error("Get weeks error:", error);
 
    res.json([
      { week: 1, label: "Week 1" },
      { week: 2, label: "Week 2" },
      { week: 3, label: "Week 3" },
      { week: 4, label: "Week 4" },
      { week: 5, label: "Week 5" }
    ]);
  }
};

export const getCustomReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const startDateFilter = moment(startDate).startOf("day").toDate();
    const endDateFilter = moment(endDate).endOf("day").toDate();

    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDateFilter, endDateFilter],
        },
      },
      include: [
        {
          model: Table,
          as: "table",
          attributes: ["id", "tableNumber"],
        },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Menu,
              as: "menu",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalSales = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount),
      0
    );
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    ).length;
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const preparingOrders = orders.filter(
      (order) => order.status === "preparing"
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const completedSales = orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    res.json({
      orders,
      summary: {
        totalSales: totalSales.toFixed(2),
        totalOrders,
        completedOrders,
        pendingOrders,
        preparingOrders,
        averageOrderValue: averageOrderValue.toFixed(2),
        completedSales: completedSales.toFixed(2),
        dateRange: {
          start: startDateFilter,
          end: endDateFilter,
        },
      },
    });
  } catch (error) {
    console.error("Get custom report error:", error);
    res.status(500).json({ message: "Server error" });
  }
};