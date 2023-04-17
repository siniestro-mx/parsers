const mongoose = require('mongoose');

// Configuración de opciones de conexión


const dbUri = process.env.LOCANET_DB_URI;

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(dbUri);
    console.log('Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
  }
};

module.exports.connectToMongoDB = connectToMongoDB;
