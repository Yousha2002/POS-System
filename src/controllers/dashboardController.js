import { Menu, Table, Order, OrderItem,sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import moment from 'moment';

export const getDashboardStats = async (req, res) => {
  try {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

  
    const totalMenuItems = await Menu.count();


    const availableTables = await Table.count({
      where: { isOccupied: false }
    });


    const todaysOrdersCount = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [todayStart, todayEnd]
        }
      }
    });


    const todaysRevenueResult = await Order.findOne({
      where: {
        createdAt: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue']
      ],
      raw: true
    });

    const todaysRevenue = todaysRevenueResult?.totalRevenue || 0;

    const recentActivities = await getRecentActivities();

    res.json({
      success: true,
      stats: {
        totalMenuItems,
        availableTables,
        todaysOrders: todaysOrdersCount,
        todaysRevenue: parseFloat(todaysRevenue)
      },
      recentActivities
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getRecentActivities = async () => {
  try {
    const activities = [];

    // Get recent orders (last 10)
    const recentOrders = await Order.findAll({
      include: [
        {
          model: Table,
          as: 'table',
          attributes: ['tableNumber']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

 
    recentOrders.forEach(order => {
      let action = '';
      let details = '';
      
      switch (order.status) {
        case 'pending':
          action = 'New order placed';
          details = `Table ${order.table.tableNumber}`;
          break;
        case 'preparing':
          action = 'Order in preparation';
          details = `Table ${order.table.tableNumber}`;
          break;
        case 'completed':
          action = 'Order completed';
          details = `Table ${order.table.tableNumber}`;
          break;
        default:
          action = 'Order updated';
          details = `Table ${order.table.tableNumber}`;
      }

      activities.push({
        action,
        time: moment(order.createdAt).fromNow(),
        details,
        type: 'order',
        createdAt: order.createdAt
      });
    });

    // Get recent menu updates (last 5)
    const recentMenuUpdates = await Menu.findAll({
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    // Add menu activities
    recentMenuUpdates.forEach(menu => {
      if (menu.createdAt.getTime() === menu.updatedAt.getTime()) {
        // New menu item
        activities.push({
          action: 'Menu item added',
          time: moment(menu.createdAt).fromNow(),
          details: menu.name,
          type: 'menu',
          createdAt: menu.createdAt
        });
      } else {
        // Menu item updated
        activities.push({
          action: 'Menu item updated',
          time: moment(menu.updatedAt).fromNow(),
          details: menu.name,
          type: 'menu',
          createdAt: menu.updatedAt
        });
      }
    });

    // Get recent table status changes (last 5)
    const recentTableChanges = await Table.findAll({
      where: {
        updatedAt: {
          [Op.gte]: moment().subtract(24, 'hours').toDate()
        }
      },
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    // Add table activities
    recentTableChanges.forEach(table => {
      if (table.isOccupied) {
        activities.push({
          action: 'Table occupied',
          time: moment(table.updatedAt).fromNow(),
          details: `Table ${table.tableNumber}`,
          type: 'table',
          createdAt: table.updatedAt
        });
      } else {
        activities.push({
          action: 'Table available',
          time: moment(table.updatedAt).fromNow(),
          details: `Table ${table.tableNumber}`,
          type: 'table',
          createdAt: table.updatedAt
        });
      }
    });

    // Sort all activities by date (newest first) and take top 8
    return activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

  } catch (error) {
    console.error('Get recent activities error:', error);
    return [];
  }
};

// Additional function to get detailed today's stats
export const getTodaysDetailedStats = async (req, res) => {
  try {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // Get today's orders with details
    const todaysOrders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      include: [
        {
          model: Table,
          as: 'table',
          attributes: ['tableNumber']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['name']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate stats
    const totalOrders = todaysOrders.length;
    const completedOrders = todaysOrders.filter(order => order.status === 'completed').length;
    const pendingOrders = todaysOrders.filter(order => order.status === 'pending').length;
    const preparingOrders = todaysOrders.filter(order => order.status === 'preparing').length;
    
    const totalRevenue = todaysOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get popular items today
    const popularItems = await getPopularItemsToday(todayStart, todayEnd);

    res.json({
      success: true,
      stats: {
        totalOrders,
        completedOrders,
        pendingOrders,
        preparingOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
      },
      popularItems,
      todaysOrders: todaysOrders.slice(0, 10) // Last 10 orders
    });
  } catch (error) {
    console.error('Get today stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getPopularItemsToday = async (startDate, endDate) => {
  try {
    const popularItems = await OrderItem.findAll({
      attributes: [
        'menuId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
      ],
      include: [{
        model: Menu,
        as: 'menu',
        attributes: ['name', 'price']
      }, {
        model: Order,
        as: 'order',
        attributes: [],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        required: true
      }],
      group: ['menuId', 'menu.id'],
      order: [[sequelize.literal('totalQuantity'), 'DESC']],
      limit: 5
    });

    return popularItems.map(item => ({
      menuId: item.menuId,
      name: item.menu.name,
      totalQuantity: item.get('totalQuantity'),
      price: item.menu.price
    }));
  } catch (error) {
    console.error('Get popular items error:', error);
    return [];
  }
};