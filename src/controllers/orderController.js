// src/controllers/orderController.js
import { Order, OrderItem, Menu, Table } from "../models/index.js";
import { Op } from "sequelize";


export const getAllOrders = async (req, res) => {
  try {
    const {
      orderId,
      tableNumber,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10
    } = req.query;

    let whereClause = {};
    
    if (orderId) {
      whereClause.id = orderId;
    }

    if (status) {
      whereClause.status = status;
    }

    whereClause.createdAt = {};
    
    if (fromDate || toDate) {

      if (fromDate) {
        whereClause.createdAt[Op.gte] = new Date(fromDate);
      }
      if (toDate) {

        const toDateObj = new Date(toDate);
        toDateObj.setDate(toDateObj.getDate() + 1);
        whereClause.createdAt[Op.lt] = toDateObj;
      }
    } else {

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      whereClause.createdAt[Op.gte] = startOfMonth;
      whereClause.createdAt[Op.lt] = startOfNextMonth;
    }


    let tableWhereClause = {};
    if (tableNumber) {
      tableWhereClause.tableNumber = tableNumber;
    }

    const offset = (page - 1) * limit;

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Table,
          as: "table",
          attributes: ["id", "tableNumber"],
          where: tableWhereClause
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
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      orders: orders.rows,
      totalCount: orders.count,
      totalPages: Math.ceil(orders.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const getAllOrders = async (req, res) => {
//   try {
//     const {
//       orderId,
//       tableNumber,
//       status,
//       fromDate,
//       toDate,
//       page = 1,
//       limit = 10
//     } = req.query;

//     // Build where clause
//     let whereClause = {};
    
//     // Order ID filter
//     if (orderId) {
//       whereClause.id = orderId;
//     }

//     // Status filter
//     if (status) {
//       whereClause.status = status;
//     }

//     // Date range filter
//     if (fromDate || toDate) {
//       whereClause.createdAt = {};
//       if (fromDate) {
//         whereClause.createdAt[Op.gte] = new Date(fromDate);
//       }
//       if (toDate) {
//         // Add one day to include the entire toDate
//         const toDateObj = new Date(toDate);
//         toDateObj.setDate(toDateObj.getDate() + 1);
//         whereClause.createdAt[Op.lt] = toDateObj;
//       }
//     }

//     // Table number filter through include
//     let tableWhereClause = {};
//     if (tableNumber) {
//       tableWhereClause.tableNumber = tableNumber;
//     }

//     const offset = (page - 1) * limit;

//     const orders = await Order.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: Table,
//           as: "table",
//           attributes: ["id", "tableNumber"],
//           where: tableWhereClause
//         },
//         {
//           model: OrderItem,
//           as: "orderItems",
//           include: [
//             {
//               model: Menu,
//               as: "menu",
//               attributes: ["id", "name", "price"],
//             },
//           ],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//       limit: parseInt(limit),
//       offset: offset
//     });

//     res.json({
//       orders: orders.rows,
//       totalCount: orders.count,
//       totalPages: Math.ceil(orders.count / limit),
//       currentPage: parseInt(page)
//     });
//   } catch (error) {
//     console.error("Get orders error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
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
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { tableId, orderItems, status } = req.body;

    let totalAmount = 0;
    for (const item of orderItems) {
      const menu = await Menu.findByPk(item.menuId);
      if (!menu) {
        return res
          .status(400)
          .json({ message: `Menu item ${item.menuId} not found` });
      }
      totalAmount += menu.price * item.quantity;
    }

    const order = await Order.create({
      tableId,
      totalAmount,
      status: status || "pending",
    });

    for (const item of orderItems) {
      const menu = await Menu.findByPk(item.menuId);
      await OrderItem.create({
        orderId: order.id,
        menuId: item.menuId,
        quantity: item.quantity,
        price: menu.price,
      });
    }


    await Table.update({ isOccupied: true }, { where: { id: tableId } });

    const createdOrder = await Order.findByPk(order.id, {
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
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateOrder = async (req, res) => {
  try {
    const { tableId, orderItems, status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let totalAmount = 0;

    if (orderItems) {
      for (const item of orderItems) {
        const menu = await Menu.findByPk(item.menuId);
        if (!menu) {
          return res
            .status(400)
            .json({ message: `Menu item ${item.menuId} not found` });
        }
        totalAmount += menu.price * item.quantity;
      }

      await OrderItem.destroy({ where: { orderId: order.id } });
      for (const item of orderItems) {
        const menu = await Menu.findByPk(item.menuId);
        await OrderItem.create({
          orderId: order.id,
          menuId: item.menuId,
          quantity: item.quantity,
          price: menu.price,
        });
      }
    } else {
      totalAmount = order.totalAmount;
    }

    await order.update({
      tableId: tableId || order.tableId,
      totalAmount,
      status: status || order.status,
    });

    if (status === "completed") {
      await Table.update(
        { isOccupied: false },
        { where: { id: order.tableId } }
      );
    }

    else if (status === "pending" || status === "preparing") {
      await Table.update(
        { isOccupied: true },
        { where: { id: order.tableId } }
      );
    }

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Table, as: "table", attributes: ["id", "tableNumber"] },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            { model: Menu, as: "menu", attributes: ["id", "name", "price"] },
          ],
        },
      ],
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await OrderItem.destroy({ where: { orderId: order.id } });

    await Table.update({ isOccupied: false }, { where: { id: order.tableId } });

    await order.destroy();
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
