
import app from './app.js';
import { sequelize } from './models/index.js';
import { User } from './models/index.js';

const PORT = process.env.PORT || 5000;

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync({ force: false });
    console.log('Database synchronized.');


    const adminExists = await User.findOne({ where: { email: 'admin@restaurant.com' } });
    if (!adminExists) {
      await User.create({
        email: 'admin@restaurant.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('Default admin user created.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch(console.error);