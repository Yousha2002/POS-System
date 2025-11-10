
import sequelize from '../config/database.js';
import User from './User.js';
import Menu from './Menu.js';
import Table from './Table.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';

Table.hasMany(Order, { foreignKey: 'tableId', as: 'orders' });
Order.belongsTo(Table, { foreignKey: 'tableId', as: 'table' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Menu.hasMany(OrderItem, { foreignKey: 'menuId', as: 'orderItems' });
OrderItem.belongsTo(Menu, { foreignKey: 'menuId', as: 'menu' });

export {
  sequelize,
  User,
  Menu,
  Table,
  Order,
  OrderItem
};