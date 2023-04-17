const mongoose = require('mongoose');

const DeviceModelSchema = new mongoose.Schema({
  ProtocolVersion: {
    type: Number,
    required: true
  },
  UniqueID: {
    type: String,
    required: true
  },
  DeviceName: {
    type: String,
  },
  SendTime: {
    type: Date,
    required: true
  },
  CountNumber: {
    type: Number,
    required: true
  },
  Latitude: {
    type: Number,
  },
  Longitude: {
    type: Number,
  },
  Altitude: {
    type: Number,
  },
  Speed: {
    type: Number,
  },
  Azimuth: {
    type: Number,
  },
  Mileage: {
    type: Number,
  },
  Event: {
    type: String,
  },
  is_valid: {
    type: Boolean,
  },
  valid_position: {
    type: Boolean,
  }
},{
  timestamps: false,
  collection: "gpsHistories",
  timeseries: {
    timeField: "SendTime",
    metaField: null, // Opcional: especifica el campo de metadatos si es necesario
    granularity: "seconds", // Opcional: segundos, minutos, horas, etc.
  },
});

const ModeloDispositivoModel = mongoose.model('GpsHistory', ModeloDispositivoSchema);

module.exports = ModeloDispositivoModel;
