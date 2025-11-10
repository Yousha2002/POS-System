// src/models/Order.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tableId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tables',
      key: 'id'
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'preparing', 'completed'),
    defaultValue: 'pending'
  }
});

export default Order;